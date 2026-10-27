import Link from "next/link";
import { getEnquiries, type Enquiry } from "@/lib/data";
import { CLASSES } from "@/lib/stats";
import { STATUS_LIST, STATUS_STYLE, filterEnquiries, parseParams, type SP } from "@/lib/filter";

export const metadata = { title: "All enquiries | Beacon", robots: { index: false } };
const PAGE = 25;

export default async function EnquiriesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const p = parseParams(await searchParams);
  let all: Enquiry[];
  try {
    all = await getEnquiries();
  } catch (e) {
    console.error("Enquiries read failed", e);
    return <main className="p-8 text-red-700">Could not load data from Google Sheets. Check the server logs.</main>;
  }

  const list = filterEnquiries(all, p);
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const cur = Math.min(Math.max(1, Number(p.page) || 1), pages);
  const rows = list.slice((cur - 1) * PAGE, cur * PAGE);
  const sources = [...new Set(all.map((e) => e.source))].filter(Boolean).sort();

  const qs = (extra: Record<string, string>) => {
    const u = new URLSearchParams();
    Object.entries({ ...p, ...extra }).forEach(([k, v]) => { if (v) u.set(k, v); });
    return u.toString();
  };
  const field = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200";
  const lbl = "mb-1 block text-xs font-semibold text-slate-600";
  const nav = "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700";

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">All enquiries</h1>
          <p className="text-sm text-slate-500">{list.length} of {all.length} enquiries</p>
        </div>
        <a href={`/dashboard/enquiries/export?${qs({ page: "" })}`} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
          Export CSV ({list.length})
        </a>
      </div>

      <form method="get" className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-6">
        <div className="col-span-2 md:col-span-2">
          <label className={lbl} htmlFor="q">Search</label>
          <input id="q" name="q" defaultValue={p.q} placeholder="Name, mobile, school or ID" className={field} />
        </div>
        <div>
          <label className={lbl} htmlFor="cls">Class</label>
          <select id="cls" name="cls" defaultValue={p.cls} className={field}>
            <option value="">All</option>{CLASSES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl} htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={p.status} className={field}>
            <option value="">All</option>{STATUS_LIST.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="col-span-2 md:col-span-2">
          <label className={lbl} htmlFor="src">Source</label>
          <select id="src" name="src" defaultValue={p.src} className={field}>
            <option value="">All</option>
            {sources.map((s) => <option key={s}>{s}</option>)}
            <option value="_none">(not given)</option>
          </select>
        </div>
        <div>
          <label className={lbl} htmlFor="from">From date</label>
          <input id="from" name="from" type="date" defaultValue={p.from} className={field} />
        </div>
        <div>
          <label className={lbl} htmlFor="to">To date</label>
          <input id="to" name="to" type="date" defaultValue={p.to} className={field} />
        </div>
        <div className="col-span-2 flex items-end gap-2 md:col-span-4">
          <button className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white">Search</button>
          <Link href="/dashboard/enquiries" className={nav}>Clear</Link>
        </div>
      </form>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="text-slate-500">
            <tr>{["Date", "Student", "Class", "Board", "Mobile", "Source", "Status", "Next call", ""].map((h) => (
              <th key={h} className="whitespace-nowrap border-b border-slate-200 px-3 py-3 font-semibold">{h}</th>))}</tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id} className="border-b border-slate-100 last:border-0">
                <td className="whitespace-nowrap px-3 py-3 text-slate-500">{e.created.slice(5, 10)}</td>
                <td className="px-3 py-3 font-semibold">
                  <Link href={`/dashboard/enquiries/${e.id}`} className="text-slate-900 hover:text-indigo-700">{e.student}</Link>
                </td>
                <td className="px-3 py-3">{e.klass}</td>
                <td className="px-3 py-3">{e.board || "-"}</td>
                <td className="whitespace-nowrap px-3 py-3">{e.mobile}</td>
                <td className="px-3 py-3">{e.source || "-"}</td>
                <td className="px-3 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[e.status] ?? "bg-slate-100 text-slate-700"}`}>{e.status}</span>
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-slate-600">{e.nextFollowUp ? e.nextFollowUp.slice(5, 10) : "-"}</td>
                <td className="whitespace-nowrap px-3 py-3 font-semibold text-indigo-700">
                  <a href={`tel:+91${e.mobile}`}>Call</a>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={9} className="px-3 py-10 text-center text-slate-400">No enquiries match these filters</td></tr>}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          {cur > 1 ? <Link href={`/dashboard/enquiries?${qs({ page: String(cur - 1) })}`} className={nav}>← Previous</Link> : <span />}
          <span className="text-sm text-slate-500">Page {cur} of {pages}</span>
          {cur < pages ? <Link href={`/dashboard/enquiries?${qs({ page: String(cur + 1) })}`} className={nav}>Next →</Link> : <span />}
        </div>
      )}
    </main>
  );
}
