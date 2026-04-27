"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export type MutationActionState = {
  success: boolean;
  message: string;
};

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function resolveStudyCenterId(supabase: SupabaseClient, userId: string) {
  const lookupColumns = ["id", "user_id", "auth_user_id"];

  for (const column of lookupColumns) {
    const { data, error } = await supabase
      .from("staff")
      .select("study_center_id")
      .eq(column, userId)
      .limit(1)
      .maybeSingle();

    if (error) {
      const lowerMessage = error.message.toLowerCase();
      const isMissingColumnError = lowerMessage.includes("column") && lowerMessage.includes("does not exist");

      if (isMissingColumnError) {
        continue;
      }

      return {
        studyCenterId: null,
        errorMessage: error.message,
      };
    }

    if (typeof data?.study_center_id === "string" && data.study_center_id.trim()) {
      return {
        studyCenterId: data.study_center_id,
        errorMessage: null,
      };
    }
  }

  return {
    studyCenterId: null,
    errorMessage: "No staff profile is linked to this user.",
  };
}

export async function addStudent(
  _prevState: MutationActionState,
  formData: FormData,
): Promise<MutationActionState> {
  console.log("🚨 SERVER RECEIVED:", Object.fromEntries(formData.entries()));

  const firstNameEntry = formData.get("first_name");
  const lastNameEntry = formData.get("last_name");
  const phoneEntry = formData.get("phone");
  const genderEntry = formData.get("gender");
  const testingScoreEntry = formData.get("testingScore");
  const internalNotesEntry = formData.get("internalNotes");
  const statusEntry = formData.get("status");
  const groupIdEntry = formData.get("group_id");
  const courseId = formData.get("course_id") as string;

  const firstName = typeof firstNameEntry === "string" ? firstNameEntry.trim() : "";
  const lastName = typeof lastNameEntry === "string" ? lastNameEntry.trim() : "";
  const phone = typeof phoneEntry === "string" ? phoneEntry.trim() : "";
  const gender = typeof genderEntry === "string" ? genderEntry.trim() : "";
  const testingScoreInput =
    typeof testingScoreEntry === "string" ? testingScoreEntry.trim() : "";
  const internalNotes =
    typeof internalNotesEntry === "string" ? internalNotesEntry.trim() : "";
  const statusInput = typeof statusEntry === "string" ? statusEntry.trim() : "";
  const groupId = typeof groupIdEntry === "string" ? groupIdEntry.trim() : "";

  if (!firstName || !lastName || !phone) {
    return {
      success: false,
      message: "First name, last name, and phone are required.",
    };
  }

  const testingScore = testingScoreInput ? Number(testingScoreInput) : null;

  if (testingScoreInput && !Number.isFinite(testingScore)) {
    return {
      success: false,
      message: "Testing score must be a valid number.",
    };
  }

  const studentStatus: "lead" | "evaluating" | "active" | "frozen" =
    statusInput === "active" ||
    statusInput === "lead" ||
    statusInput === "evaluating" ||
    statusInput === "frozen"
      ? statusInput
      : "evaluating";

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      message: "You must be signed in to add a student.",
    };
  }

  const { data: staff, error: staffError } = await supabase
    .from("staff")
    .select("study_center_id")
    .eq("id", user.id)
    .single();

  console.log("🚨 1. LOGGED IN USER ID:", user?.id);
  console.log("🚨 2. STAFF DATA RETURNED:", staff);
  console.log("🚨 3. STAFF FETCH ERROR:", staffError);

  const { studyCenterId, errorMessage } = await resolveStudyCenterId(supabase, user.id);

  if (!studyCenterId) {
    return {
      success: false,
      message: errorMessage ?? "Could not resolve study center for this user.",
    };
  }

  const { data: insertedStudent, error: insertStudentError } = await supabase
    .from("students")
    .insert({
      first_name: firstName,
      last_name: lastName,
      phone,
      gender: gender || null,
      testing_score: testingScore || null,
      internal_notes: internalNotes || null,
      status: studentStatus,
      interested_course_id: courseId || null,
      study_center_id: studyCenterId,
    })
    .select("id")
    .single();

  if (insertStudentError) {
    if (
      insertStudentError.message.includes("unique constraint") ||
      insertStudentError.code === "23505"
    ) {
      return {
        success: false,
        message: "A student with this phone number already exists in your center.",
      };
    }

    return {
      success: false,
      message: insertStudentError.message,
    };
  }

  if (!insertedStudent?.id) {
    return {
      success: false,
      message: "Failed to create student.",
    };
  }

  if (groupId && groupId.trim() !== "") {
    const { error: groupLinkError } = await supabase.from("group_students").insert({
      student_id: insertedStudent.id,
      group_id: groupId,
    });

    if (groupLinkError) {
      return {
        success: false,
        message: `Student was created but could not be linked to the selected group: ${groupLinkError.message}`,
      };
    }
  }

  revalidatePath("/manage/students");
  revalidatePath("/manage/classes");
  revalidatePath("/manage/instructors");

  return {
    success: true,
    message: "Student Added",
  };
}

export async function updateStudent(studentId: string, formData: FormData): Promise<MutationActionState> {
  const targetStudentId = studentId.trim();

  if (!targetStudentId) {
    return {
      success: false,
      message: "Student id is required.",
    };
  }

  const firstNameEntry = formData.get("first_name");
  const lastNameEntry = formData.get("last_name");
  const phoneEntry = formData.get("phone");
  const genderEntry = formData.get("gender");
  const testingScoreEntry = formData.get("testingScore");
  const internalNotesEntry = formData.get("internalNotes");
  const statusEntry = formData.get("status");
  const groupIdEntry = formData.get("group_id");
  const courseIdEntry = formData.get("course_id");

  const firstName = typeof firstNameEntry === "string" ? firstNameEntry.trim() : "";
  const lastName = typeof lastNameEntry === "string" ? lastNameEntry.trim() : "";
  const phone = typeof phoneEntry === "string" ? phoneEntry.trim() : "";
  const gender = typeof genderEntry === "string" ? genderEntry.trim() : "";
  const testingScoreInput =
    typeof testingScoreEntry === "string" ? testingScoreEntry.trim() : "";
  const internalNotes =
    typeof internalNotesEntry === "string" ? internalNotesEntry.trim() : "";
  const statusInput = typeof statusEntry === "string" ? statusEntry.trim() : "";
  const groupId = typeof groupIdEntry === "string" ? groupIdEntry.trim() : "";
  const courseId = typeof courseIdEntry === "string" ? courseIdEntry.trim() : "";

  if (!firstName || !lastName || !phone) {
    return {
      success: false,
      message: "First name, last name, and phone are required.",
    };
  }

  const testingScore = testingScoreInput ? Number(testingScoreInput) : null;

  if (testingScoreInput && !Number.isFinite(testingScore)) {
    return {
      success: false,
      message: "Testing score must be a valid number.",
    };
  }

  const studentStatus: "lead" | "evaluating" | "active" | "frozen" =
    statusInput === "active" ||
    statusInput === "lead" ||
    statusInput === "evaluating" ||
    statusInput === "frozen"
      ? statusInput
      : "evaluating";

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      message: "You must be signed in to edit a student.",
    };
  }

  const { studyCenterId, errorMessage } = await resolveStudyCenterId(supabase, user.id);

  if (!studyCenterId) {
    return {
      success: false,
      message: errorMessage ?? "Could not resolve study center for this user.",
    };
  }

  const { error: updateStudentError } = await supabase
    .from("students")
    .update({
      first_name: firstName,
      last_name: lastName,
      phone,
      gender: gender || null,
      testing_score: testingScore ?? null,
      internal_notes: internalNotes || null,
      status: studentStatus,
      interested_course_id: courseId || null,
      study_center_id: studyCenterId,
    })
    .eq("id", targetStudentId)
    .eq("study_center_id", studyCenterId);

  if (updateStudentError) {
    if (
      updateStudentError.message.includes("unique constraint") ||
      updateStudentError.code === "23505"
    ) {
      return {
        success: false,
        message: "A student with this phone number already exists in your center.",
      };
    }

    return {
      success: false,
      message: updateStudentError.message,
    };
  }

  const { error: clearGroupError } = await supabase
    .from("group_students")
    .delete()
    .eq("student_id", targetStudentId);

  if (clearGroupError) {
    return {
      success: false,
      message: clearGroupError.message,
    };
  }

  if (groupId) {
    const { error: groupLinkError } = await supabase
      .from("group_students")
      .insert({
        student_id: targetStudentId,
        group_id: groupId,
      });

    if (groupLinkError) {
      return {
        success: false,
        message: groupLinkError.message,
      };
    }
  }

  revalidatePath("/manage/students");
  revalidatePath("/manage/classes");
  revalidatePath("/manage/instructors");

  return {
    success: true,
    message: "Student updated",
  };
}

export async function deleteStudent(studentId: string): Promise<MutationActionState> {
  const targetStudentId = studentId.trim();

  if (!targetStudentId) {
    return {
      success: false,
      message: "Student id is required.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      message: "You must be signed in to delete a student.",
    };
  }

  const { studyCenterId, errorMessage } = await resolveStudyCenterId(supabase, user.id);

  if (!studyCenterId) {
    return {
      success: false,
      message: errorMessage ?? "Could not resolve study center for this user.",
    };
  }

  const { error: clearGroupLinksError } = await supabase
    .from("group_students")
    .delete()
    .eq("student_id", targetStudentId);

  if (clearGroupLinksError) {
    return {
      success: false,
      message: clearGroupLinksError.message,
    };
  }

  const { data: deletedStudent, error: deleteStudentError } = await supabase
    .from("students")
    .delete()
    .eq("id", targetStudentId)
    .eq("study_center_id", studyCenterId)
    .select("id")
    .maybeSingle();

  if (deleteStudentError) {
    return {
      success: false,
      message: deleteStudentError.message,
    };
  }

  if (!deletedStudent?.id) {
    return {
      success: false,
      message: "Student was not found or you do not have access to delete it.",
    };
  }

  revalidatePath("/manage/students");
  revalidatePath("/manage/classes");
  revalidatePath("/manage/instructors");

  return {
    success: true,
    message: "Student deleted",
  };
}

export async function freezeStudent(studentId: string): Promise<MutationActionState> {
  const targetStudentId = studentId.trim();

  if (!targetStudentId) {
    return {
      success: false,
      message: "Student id is required.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      message: "You must be signed in to freeze a student.",
    };
  }

  const { studyCenterId, errorMessage } = await resolveStudyCenterId(supabase, user.id);

  if (!studyCenterId) {
    return {
      success: false,
      message: errorMessage ?? "Could not resolve study center for this user.",
    };
  }

  const { error: clearGroupError } = await supabase
    .from("group_students")
    .delete()
    .eq("student_id", targetStudentId);

  if (clearGroupError) {
    return {
      success: false,
      message: clearGroupError.message,
    };
  }

  const { data: frozenStudent, error: updateError } = await supabase
    .from("students")
    .update({
      status: "frozen",
      freeze_start: new Date().toISOString(),
    })
    .eq("id", targetStudentId)
    .eq("study_center_id", studyCenterId)
    .select("id")
    .maybeSingle();

  if (updateError) {
    return {
      success: false,
      message: updateError.message,
    };
  }

  if (!frozenStudent?.id) {
    return {
      success: false,
      message: "Student was not found or you do not have access to freeze it.",
    };
  }

  revalidatePath("/manage/students");
  revalidatePath("/manage/classes");

  return {
    success: true,
    message: "Student frozen",
  };
}

export async function addInstructor(formData: FormData): Promise<MutationActionState> {
  const fullNameEntry = formData.get("full_name");
  const phoneEntry = formData.get("phone");
  const courseIdEntry = formData.get("course_id");

  const fullName = typeof fullNameEntry === "string" ? fullNameEntry.trim() : "";
  const phone = typeof phoneEntry === "string" ? phoneEntry.trim() : "";
  const courseId = typeof courseIdEntry === "string" ? courseIdEntry.trim() : "";

  if (!fullName) {
    return {
      success: false,
      message: "Instructor name is required.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      message: "You must be signed in to add an instructor.",
    };
  }

  const { studyCenterId, errorMessage } = await resolveStudyCenterId(supabase, user.id);

  if (!studyCenterId) {
    return {
      success: false,
      message: errorMessage ?? "Could not resolve study center for this user.",
    };
  }

  const { error: insertError } = await supabase
    .from("instructors")
    .insert({
      full_name: fullName,
      phone: phone || null,
      course_id: courseId || null,
      study_center_id: studyCenterId,
    });

  if (insertError) {
    return {
      success: false,
      message: insertError.message,
    };
  }

  revalidatePath("/manage/instructors");
  revalidatePath("/manage/classes");

  return {
    success: true,
    message: "Instructor added",
  };
}

export async function updateInstructor(
  instructorId: string,
  formData: FormData,
): Promise<MutationActionState> {
  const targetInstructorId = instructorId.trim();
  const fullNameEntry = formData.get("full_name");
  const phoneEntry = formData.get("phone");
  const courseIdEntry = formData.get("course_id");

  const fullName = typeof fullNameEntry === "string" ? fullNameEntry.trim() : "";
  const phone = typeof phoneEntry === "string" ? phoneEntry.trim() : "";
  const courseId = typeof courseIdEntry === "string" ? courseIdEntry.trim() : "";

  if (!targetInstructorId) {
    return {
      success: false,
      message: "Instructor id is required.",
    };
  }

  if (!fullName) {
    return {
      success: false,
      message: "Instructor name is required.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      message: "You must be signed in to edit an instructor.",
    };
  }

  const { studyCenterId, errorMessage } = await resolveStudyCenterId(supabase, user.id);

  if (!studyCenterId) {
    return {
      success: false,
      message: errorMessage ?? "Could not resolve study center for this user.",
    };
  }

  const { data: updatedInstructor, error: updateError } = await supabase
    .from("instructors")
    .update({
      full_name: fullName,
      phone: phone || null,
      course_id: courseId || null,
    })
    .eq("id", targetInstructorId)
    .eq("study_center_id", studyCenterId)
    .select("id")
    .maybeSingle();

  if (updateError) {
    return {
      success: false,
      message: updateError.message,
    };
  }

  if (!updatedInstructor?.id) {
    return {
      success: false,
      message: "Instructor was not found or you do not have access to edit it.",
    };
  }

  revalidatePath("/manage/instructors");
  revalidatePath("/manage/classes");

  return {
    success: true,
    message: "Instructor updated",
  };
}

export async function deleteInstructor(instructorId: string): Promise<MutationActionState> {
  const targetInstructorId = instructorId.trim();

  if (!targetInstructorId) {
    return {
      success: false,
      message: "Instructor id is required.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      message: "You must be signed in to delete an instructor.",
    };
  }

  const { studyCenterId, errorMessage } = await resolveStudyCenterId(supabase, user.id);

  if (!studyCenterId) {
    return {
      success: false,
      message: errorMessage ?? "Could not resolve study center for this user.",
    };
  }

  // Remove group assignments first so the instructor can be deleted safely.
  const { error: clearGroupsError } = await supabase
    .from("groups")
    .update({ instructor_id: null })
    .eq("instructor_id", targetInstructorId);

  if (clearGroupsError) {
    return {
      success: false,
      message: clearGroupsError.message,
    };
  }

  const { data: deletedInstructor, error: deleteError } = await supabase
    .from("instructors")
    .delete()
    .eq("id", targetInstructorId)
    .eq("study_center_id", studyCenterId)
    .select("id")
    .maybeSingle();

  if (deleteError) {
    return {
      success: false,
      message: deleteError.message,
    };
  }

  if (!deletedInstructor?.id) {
    return {
      success: false,
      message: "Instructor was not found or you do not have access to delete it.",
    };
  }

  revalidatePath("/manage/instructors");
  revalidatePath("/manage/classes");

  return {
    success: true,
    message: "Instructor deleted",
  };
}
