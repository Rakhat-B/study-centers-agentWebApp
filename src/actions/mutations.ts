"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export type MutationActionState = {
  success: boolean;
  message: string;
};

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

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
  const firstName = readString(formData, "first_name");
  const lastName = readString(formData, "last_name");
  const phone = readString(formData, "phone");
  const gender = readString(formData, "gender");
  const testingScoreInput = readString(formData, "testingScore");
  const internalNotes = readString(formData, "internalNotes");
  const statusInput = readString(formData, "status");
  const groupId = readString(formData, "group_id");

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

  const studentStatus: "lead" | "evaluating" | "active" =
    statusInput === "active" || statusInput === "lead" || statusInput === "evaluating"
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
      testing_score: testingScore,
      internal_notes: internalNotes || null,
      status: studentStatus,
      study_center_id: studyCenterId,
    })
    .select("id")
    .single();

  if (insertStudentError || !insertedStudent?.id) {
    return {
      success: false,
      message: insertStudentError?.message ?? "Failed to create student.",
    };
  }

  if (groupId) {
    const { error: groupLinkError } = await supabase.from("group_students").insert({
      student_id: insertedStudent.id,
      group_id: groupId,
      study_center_id: studyCenterId,
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
