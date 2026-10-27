"use server";
import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";
import { COOKIE, verifySession } from "@/lib/session";
import { writeEnquiryDetails } from "@/lib/enquiries";

export type EditInput = {
  id: string; student: string; mobile: string; mobile2: string; klass: string;
  board: string; school: string; pct: string; source: string;
};

const MOBILE = /^[6-9]\d{9}$/;
const CLASSES = ["8th", "9th", "10th", "11th", "12th"];
const BOARDS = ["CBSE", "SSC", "ICSE"];

export async function updateEnquiry(i: EditInput): Promise<{ ok: boolean; error?: string }> {
  if (!(await verifySession((await cookies()).get(COOKIE)?.value))) {
    return { ok: false, error: "Session expired. Please log in again." };
  }
  const f = {
    id: i.id, student: i.student.trim().slice(0, 100), mobile: i.mobile.trim(), mobile2: i.mobile2.trim(),
    klass: i.klass, board: i.board, school: i.school.trim().slice(0, 100),
    pct: i.pct.trim().slice(0, 5), source: i.source.trim().slice(0, 40),
  };
  const pct = Number(f.pct);
  const valid =
    /^BCN-/.test(f.id) && f.student.length >= 2 && MOBILE.test(f.mobile) &&
    (f.mobile2 === "" || MOBILE.test(f.mobile2)) && CLASSES.includes(f.klass) &&
    (f.board === "" || BOARDS.includes(f.board)) && (f.pct === "" || (pct >= 0 && pct <= 100));
  if (!valid) return { ok: false, error: "Check the details: name, a 10-digit mobile starting 6-9, class and %." };

  try {
    await writeEnquiryDetails(f);
    revalidateTag("enquiries");
    return { ok: true };
  } catch (e) {
    console.error("Enquiry update failed", e);
    return { ok: false, error: "Could not save. Please try again." };
  }
}
