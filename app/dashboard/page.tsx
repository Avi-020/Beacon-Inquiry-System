import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE, verifySession } from "@/lib/session";
import { getEnquiries } from "@/lib/data";
import { computeStats } from "@/lib/stats";
import { logout, refresh } from "./actions";

export const metadata = { title: "Enquiries | Beacon", robots: { index: false } };

const STATUS: Record<string, string> = {
  New: "bg-indigo-100 text-indigo-800",
  Repeat: "bg-orange-100 text-orange-800",
  Contacted: "bg-sky-100 text-sky-800",
  "Follow-up": "bg-amber-100 text-amber-800",
  "Demo/Visit": "bg-violet-100 text-violet-800",
  Admitted: "bg-green-100 text-green-800",
  Lost: "bg-slate-200 text-slate-700",
};

function Kpi({ title, value, note, tone = "text-slate-500" }: {
  title: string; value: string | number; note?: string; tone?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-1 text-4xl font-bold tracking-tight text-slate-900">{value}</p>
      {note && <p className={`mt-1 text-sm font-medium ${tone}`}>{note}</p>}
    </div>
  );
}

function Bars({ items }: { items: [string, number][] }) {
  const max = Math.max(1, ...items.map((i) => i[1]));
  if (items.every((i) => i[1] === 0)) return <p className="text-sm text-slate-400">No data yet</p>;
  return (
    <ul className="space-y-3">
      {items.map(([name, n]) => (
        <li key={name} className="grid grid-cols-[8rem_1fr_2rem] items-center gap-3 text-sm">
          <span className="truncate text-slate-700">{name}</span>
          <span className="h-2 overflow-hidden rounded-full bg-slate-100">
            <span className="block h-full rounded-full bg-indigo-600" style={{ width: `${(n / max) * 100}%` }} />
          </span>
          <span className="text-right font-semibold text-slate-900">{n}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  if (!(await verifySession((await cookies()).get(COOKIE)?.value))) redirect("/login");

  const range = (await searchParams).range === "all" ? "all" : "month";
  let all;
  try {
    all = await getEnquiries();
  } catch (e) {
    console.error("Dashboard read failed", e);
    return <main className="p-8 text-red-700">Could not load enquiries from Google Sheets. Check the server logs.</main>;
  }
  const s = computeStats(all, range);
  const weekMax = Math.max(1, ...s.weeks);
  const pill = (active: boolean) =>
    `rounded-xl border px-4 py-2 text-sm font-medium ${active ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-white text-slate-700"}`;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">B</span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Enquiries</h1>
            <p className="text-sm text-slate-500">{range === "month" ? "This month" : "All time"}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/dashboard" className={pill(range === "month")}>This month</Link>
          <Link href="/dashboard?range=all" className={pill(range === "all")}>All time</Link>
          <form action={refresh}><button className={pill(false)}>Refresh</button></form>
          <form action={logout}><button className={pill(false)}>Logout</button></form>
        </div>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi title="Total enquiries" value={s.total}
             note={s.deltaPct === null ? undefined : `${s.deltaPct >= 0 ? "+" : ""}${s.deltaPct}% vs last month`}
             tone={s.deltaPct !== null && s.deltaPct < 0 ? "text-red-600" : "text-green-700"} />
        <Kpi title="Open (need follow-up)" value={s.openCount}
             note={s.overdue ? `${s.overdue} overdue` : "None overdue"}
             tone={s.overdue ? "text-amber-700" : "text-green-700"} />
        <Kpi title="Admitted" value={s.admitted} />
        <Kpi title="Conversion rate" value={`${s.conversion}%`} />
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-900">Enquiries per week</h2>
          <div className="mt-4 flex h-44 items-end gap-4">
            {s.weeks.map((n, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <span className="text-sm font-semibold text-slate-900">{n}</span>
                <div className={`w-full rounded-lg ${i === 3 ? "bg-indigo-600" : "bg-indigo-200"}`}
                     style={{ height: `${(n / weekMax) * 75}%`, minHeight: 4 }} />
                <span className="text-xs text-slate-500">{i === 3 ? "This wk" : `${3 - i} wk ago`}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 font-bold text-slate-900">Where they heard about us</h2>
          <Bars items={s.sources} />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <h2 className="mb-4 font-bold text-slate-900">Interest by class</h2>
          <Bars items={s.byClass} />
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold text-slate-900">Latest enquiries</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-slate-500">
              <tr>{["Date", "Student", "Class", "Board", "Last yr %", "Parent mobile", "Source", "Status", "Action"].map((h) => (
                <th key={h} className="whitespace-nowrap border-b border-slate-200 px-2 py-2 font-semibold">{h}</th>))}</tr>
            </thead>
            <tbody>
              {s.latest.map((e) => (
                <tr key={e.id} className="border-b border-slate-100 last:border-0">
                  <td className="whitespace-nowrap px-2 py-3 text-slate-500">{e.created.slice(5, 10)}</td>
                  <td className="px-2 py-3 font-semibold text-slate-900">{e.student}</td>
                  <td className="px-2 py-3">{e.klass}</td>
                  <td className="px-2 py-3">{e.board || "-"}</td>
                  <td className="px-2 py-3">{e.pct || "-"}</td>
                  <td className="whitespace-nowrap px-2 py-3">{e.mobile}</td>
                  <td className="px-2 py-3">{e.source || "-"}</td>
                  <td className="px-2 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS[e.status] ?? "bg-slate-100 text-slate-700"}`}>{e.status}</span>
                  </td>
                  <td className="whitespace-nowrap px-2 py-3 font-semibold text-indigo-700">
                    <a href={`tel:+91${e.mobile}`}>Call</a>
                    <span className="px-1 text-slate-300">|</span>
                    <a href={`https://wa.me/91${e.mobile}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                  </td>
                </tr>
              ))}
              {s.latest.length === 0 && (
                <tr><td colSpan={9} className="px-2 py-8 text-center text-slate-400">No enquiries yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
