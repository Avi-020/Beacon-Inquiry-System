import Link from "next/link";
import { notFound } from "next/navigation";
import { getEnquiries } from "@/lib/data";
import { getFollowUps } from "@/lib/followups";
import { STATUS_STYLE } from "@/lib/filter";
import EditEnquiryForm from "@/components/EditEnquiryForm";

export const metadata = { title: "Student | Beacon", robots: { index: false } };

function Item({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-slate-500">{k}</dt>
      <dd className="mt-0.5 text-slate-900">{children || "-"}</dd>
    </div>
  );
}

export default async function StudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [all, fups] = await Promise.all([getEnquiries(), getFollowUps()]);
  const e = all.find((x) => x.id === id);
  if (!e) notFound();
  const history = fups.filter((f) => f.enquiryId === id).sort((a, b) => b.when.localeCompare(a.when));

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <Link href="/dashboard/enquiries" className="text-sm font-semibold text-indigo-700">← All enquiries</Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-900">{e.student}</h1>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[e.status] ?? "bg-slate-100 text-slate-700"}`}>{e.status}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold">
        <a href={`tel:+91${e.mobile}`} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-indigo-700">Call</a>
        <a href={`https://wa.me/91${e.mobile}`} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-indigo-700">WhatsApp</a>
        <Link href="/dashboard/followups" className="rounded-xl bg-indigo-600 px-4 py-2 text-white">Log a call in Follow-ups</Link>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 font-bold text-slate-900">Details</h2>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <Item k="Class">{e.klass}</Item>
            <Item k="Board">{e.board}</Item>
            <Item k="School">{e.school}</Item>
            <Item k="Last year %">{e.pct}</Item>
            <Item k="Parent mobile">{e.mobile}</Item>
            <Item k="Second number">{e.mobile2}</Item>
            <Item k="Source">{e.source}</Item>
            <Item k="Enquiry date">{e.created}</Item>
            <Item k="Next follow-up">{e.nextFollowUp}</Item>
            <Item k="Last updated">{e.updated}</Item>
            {e.status === "Lost" && <Item k="Lost reason">{e.lostReason}</Item>}
            <Item k="ID">{e.id}</Item>
          </dl>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 font-bold text-slate-900">Edit details</h2>
          <EditEnquiryForm
            key={e.updated}
            initial={{ id: e.id, student: e.student, mobile: e.mobile, mobile2: e.mobile2, klass: e.klass,
              board: e.board, school: e.school, pct: e.pct, source: e.source }}
          />
        </section>
      </div>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 font-bold text-slate-900">Call history ({history.length})</h2>
        {history.length === 0 && <p className="text-sm text-slate-400">No calls logged yet</p>}
        <ul className="space-y-3">
          {history.map((h) => (
            <li key={h.id} className="rounded-xl bg-slate-50 p-3 text-sm">
              <p className="font-semibold text-slate-900">{h.outcome} <span className="font-normal text-slate-500">· {h.by} · {h.when}</span></p>
              {h.comment && <p className="mt-1 text-slate-700">{h.comment}</p>}
              {h.next && <p className="mt-1 text-slate-500">Next follow-up: {h.next}</p>}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
