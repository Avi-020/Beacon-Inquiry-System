"use server";
import { appendEnquiry, mobileExists } from "@/lib/sheets";

export type FormState = { ok: boolean; error?: string };

const CLASSES = ["8th", "9th", "10th", "11th", "12th"];
const BOARDS = ["CBSE", "SSC", "ICSE"];
const SOURCES = ["Friends / Family", "Social media", "Google", "Advertisement", "Seminar / Event", "Other"];
const MOBILE = /^[6-9]\d{9}$/;
const clean = (v: FormDataEntryValue | null, max = 100) =>
  String(v ?? "").trim().slice(0, max);

export async function submitEnquiry(_: FormState, fd: FormData): Promise<FormState> {
  // Honeypot: bots fill this hidden field. Pretend success, save nothing.
  if (clean(fd.get("website"))) return { ok: true };

  const student = clean(fd.get("student"));
  const mobile = clean(fd.get("mobile"), 10);
  const mobile2 = clean(fd.get("mobile2"), 10);
  const klass = clean(fd.get("klass"));
  const board = clean(fd.get("board"));
  const school = clean(fd.get("school"));
  const pct = clean(fd.get("pct"), 5);
  const hear = clean(fd.get("hear"));
  const src = clean(fd.get("src"), 30).replace(/[^\w-]/g, ""); // from ?src=poster

  const pctNum = Number(pct);
  if (
    student.length < 2 || !MOBILE.test(mobile) || !CLASSES.includes(klass) ||
    (mobile2 && !MOBILE.test(mobile2)) ||
    (board && !BOARDS.includes(board)) ||
    (hear && !SOURCES.includes(hear)) ||
    (pct && !(pctNum >= 0 && pctNum <= 100))
  ) {
    return { ok: false, error: "Please check the highlighted details and try again." };
  }

  try {
    const repeat = await mobileExists(mobile);
    await appendEnquiry(
      { student, mobile, mobile2, klass, board, school, lastYearPct: pct,
        source: src || hear },
      repeat ? "Repeat" : "New"
    );
    return { ok: true };
  } catch (err) {
    console.error("Sheets write failed", err);
    return { ok: false, error: "Could not save your enquiry. Please try again in a minute." };
  }
}
