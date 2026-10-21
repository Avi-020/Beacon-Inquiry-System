"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { COOKIE, verifySession } from "@/lib/session";

export async function logout() {
  (await cookies()).delete(COOKIE);
  redirect("/login");
}

export async function refresh() {
  if (!(await verifySession((await cookies()).get(COOKIE)?.value))) redirect("/login");
  revalidateTag("enquiries");
  redirect("/dashboard");
}
