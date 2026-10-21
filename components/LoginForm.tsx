"use client";
import { useActionState } from "react";
import { login } from "@/app/login/actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, {} as { error?: string });
  return (
    <form action={action} className="space-y-4">
      <label htmlFor="password" className="block text-sm font-semibold text-slate-900">Password</label>
      <input id="password" name="password" type="password" autoComplete="current-password" autoFocus required
             className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
      {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      <button disabled={pending}
              className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
        {pending ? "Checking…" : "Open dashboard"}
      </button>
    </form>
  );
}
