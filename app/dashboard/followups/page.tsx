import { getEnquiries, type Enquiry } from "@/lib/data";
import { getFollowUps, getStaff, type FollowUp } from "@/lib/followups";
import { OPEN, todayIST } from "@/lib/stats";
import FollowUpBoard, { type Hist, type Row } from "@/components/FollowUpBoard";

export const metadata = {
  title: "Follow-ups | Beacon",
  robots: { index: false },
};

export default async function FollowUpsPage() {
  let data: [Enquiry[], FollowUp[], string[]];
  try {
    data = await Promise.all([getEnquiries(), getFollowUps(), getStaff()]);
  } catch (e) {
    console.error("Follow-ups read failed", e);
    return (
      <main className="p-8 text-red-700">
        Could not load data from Google Sheets. Check the server logs.
      </main>
    );
  }
  const [all, fups, staff] = data;

  const hist = new Map<string, Hist[]>();
  for (const f of fups) {
    const h: Hist = {
      when: f.when,
      comment: f.comment,
      outcome: f.outcome,
      by: f.by,
      next: f.next,
    };
    hist.set(f.enquiryId, [...(hist.get(f.enquiryId) ?? []), h]);
  }
  hist.forEach((v) => v.sort((a, b) => b.when.localeCompare(a.when)));

  const rows: Row[] = all
    .filter((e) => OPEN.includes(e.status))
    .map((e) => ({
      id: e.id,
      student: e.student,
      klass: e.klass,
      board: e.board,
      mobile: e.mobile,
      source: e.source,
      status: e.status,
      nextFollowUp: e.nextFollowUp,
      created: e.created,
      history: hist.get(e.id) ?? [],
    }));

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-bold text-slate-900">Follow-ups</h1>
      <FollowUpBoard rows={rows} staff={staff} today={todayIST()} />
    </main>
  );
}
