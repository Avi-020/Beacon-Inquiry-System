"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE, createSession } from "@/lib/session";
import { revalidateTag } from "next/cache";
import { appendEnquiry, mobileExists } from "@/lib/sheets";

export async function login(_: { error?: string }, fd: FormData) {
  const expected = process.env.DASHBOARD_PASSWORD ?? "";
  if (!expected || !process.env.SESSION_SECRET) {
    return { error: "Dashboard password is not set up on the server." };
  }
  if (String(fd.get("password") ?? "") !== expected) {
    await new Promise((r) => setTimeout(r, 700)); // slows down guessing
    return { error: "Wrong password." };
  }
  (await cookies()).set(COOKIE, await createSession(7), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect("/dashboard");
}
