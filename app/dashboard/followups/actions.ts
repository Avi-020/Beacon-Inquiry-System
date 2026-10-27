"use server";
import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";
import { COOKIE, verifySession } from "@/lib/session";
import { writeFollowUp } from "@/lib/followups";

const STATUSES = ["Contacted", "Follow-up", "Demo/Visit", "Admitted", "Lost"];
const OUTCOMES = [
  "Answered",
  "No answer",
  "Call back later",
  "Interested",
  "Not interested",
  "Visit scheduled",
];
const LOST = ["Fees", "Distance", "Joined elsewhere", "Other"];

export type SaveInput = {
  enquiryId: string;
  by: string;
  when: string;
  outcome: string;
  comment: string;
  status: string;
  lostReason: string;
  next: string;
};

export async function saveFollowUp(
  i: SaveInput,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await verifySession((await cookies()).get(COOKIE)?.value))) {
    return { ok: false, error: "Session expired. Please log in again." };
  }
  const closed = i.status === "Admitted" || i.status === "Lost";
  const valid =
    /^BCN-/.test(i.enquiryId) &&
    i.by.trim().length > 0 &&
    i.by.length <= 40 &&
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(i.when) &&
    OUTCOMES.includes(i.outcome) &&
    STATUSES.includes(i.status) &&
    i.comment.length <= 500 &&
    (i.status !== "Lost" || LOST.includes(i.lostReason)) &&
    (closed ? i.next === "" : /^\d{4}-\d{2}-\d{2}$/.test(i.next));
  if (!valid)
    return { ok: false, error: "Some details are missing or invalid." };

  try {
    await writeFollowUp({ ...i, by: i.by.trim(), comment: i.comment.trim() });
    revalidateTag("enquiries");
    revalidateTag("followups");
    return { ok: true };
  } catch (e) {
    console.error("Follow-up save failed", e);
    return { ok: false, error: "Could not save. Please try again." };
  }
}
