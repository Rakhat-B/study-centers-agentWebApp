"use client";

import { ArrowRight, Lock, Mail } from "lucide-react";
import { useActionState, useMemo, useState } from "react";
import { logIn, signUp } from "../actions";

type AuthMode = "login" | "signup";

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("login");

   // 1. Define the initial state right here
   const initialState = { error: null, success: false };

   // 2. Pass 'initialState' instead of 'INITIAL_AUTH_STATE'
   const [loginState, loginAction, isLoginPending] = useActionState(logIn, initialState);
   const [signUpState, signUpAction, isSignUpPending] = useActionState(signUp, initialState);

  const activeAction = mode === "login" ? loginAction : signUpAction;
  const activeState = mode === "login" ? loginState : signUpState;
  const isPending = mode === "login" ? isLoginPending : isSignUpPending;

  const title = useMemo(
    () => (mode === "login" ? "Welcome back" : "Create your account"),
    [mode],
  );

  const subtitle =
    mode === "login"
      ? "Sign in to access your study center workspace."
      : "Sign up and start syncing secure, live center data.";

  return (
    <div className="mesh-bg min-h-screen px-4 py-10 md:py-16">
      <div className="mx-auto flex min-h-[82vh] max-w-5xl items-center justify-center">
        <div className="glass-card w-full max-w-md rounded-[26px] p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgba(29,29,31,0.55)]">
                Study Center OS
              </p>
              <h1 className="mt-2 text-[30px] font-bold leading-none tracking-tight text-[var(--foreground)]">
                {title}
              </h1>
              <p className="mt-2 text-[13px] text-[rgba(29,29,31,0.62)]">{subtitle}</p>
            </div>

            <div
              className="h-11 w-11 rounded-2xl"
              style={{
                background: "linear-gradient(135deg, #0071e3 0%, #49b6ff 100%)",
                boxShadow: "0 10px 26px rgba(0, 113, 227, 0.35)",
              }}
            />
          </div>

          <div className="mb-5 inline-flex rounded-full border border-white/45 bg-white/30 p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className="rounded-full px-4 py-2 text-[12px] font-semibold tracking-tight transition-all"
              style={{
                color: mode === "login" ? "white" : "rgba(29,29,31,0.62)",
                background:
                  mode === "login"
                    ? "linear-gradient(135deg, #006fe0 0%, #2c9aff 100%)"
                    : "transparent",
                boxShadow:
                  mode === "login" ? "0 10px 22px rgba(0, 111, 224, 0.35)" : "none",
              }}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className="rounded-full px-4 py-2 text-[12px] font-semibold tracking-tight transition-all"
              style={{
                color: mode === "signup" ? "white" : "rgba(29,29,31,0.62)",
                background:
                  mode === "signup"
                    ? "linear-gradient(135deg, #006fe0 0%, #2c9aff 100%)"
                    : "transparent",
                boxShadow:
                  mode === "signup" ? "0 10px 22px rgba(0, 111, 224, 0.35)" : "none",
              }}
            >
              Sign Up
            </button>
          </div>

          <form action={activeAction} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-semibold text-[rgba(29,29,31,0.7)]">Email</span>
              <div className="relative">
                <Mail
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(29,29,31,0.45)]"
                />
                <input
                  required
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="you@center.kz"
                  className="w-full rounded-2xl border border-white/50 bg-white/45 py-3 pl-10 pr-3 text-[14px] text-[var(--foreground)] outline-none transition focus:border-[#0071e3] focus:bg-white/70"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[12px] font-semibold text-[rgba(29,29,31,0.7)]">Password</span>
              <div className="relative">
                <Lock
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(29,29,31,0.45)]"
                />
                <input
                  required
                  type="password"
                  name="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder="Enter your password"
                  className="w-full rounded-2xl border border-white/50 bg-white/45 py-3 pl-10 pr-3 text-[14px] text-[var(--foreground)] outline-none transition focus:border-[#0071e3] focus:bg-white/70"
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={isPending}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-[14px] font-semibold tracking-tight text-white transition-all disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #006fe0 0%, #2c9aff 100%)",
                boxShadow: "0 12px 28px rgba(0, 111, 224, 0.38)",
              }}
            >
              {isPending ? "Please wait..." : mode === "login" ? "Continue to Workspace" : "Create Account"}
              <ArrowRight size={15} />
            </button>
          </form>

          {activeState.status !== "idle" ? (
            <div
              className="mt-4 rounded-2xl px-4 py-3 text-[12px] font-medium"
              style={{
                background:
                  activeState.status === "error"
                    ? "rgba(239, 68, 68, 0.12)"
                    : "rgba(34, 197, 94, 0.12)",
                border:
                  activeState.status === "error"
                    ? "1px solid rgba(239, 68, 68, 0.24)"
                    : "1px solid rgba(34, 197, 94, 0.24)",
                color:
                  activeState.status === "error"
                    ? "rgba(153, 27, 27, 0.95)"
                    : "rgba(21, 128, 61, 0.95)",
              }}
            >
              {activeState.message}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}