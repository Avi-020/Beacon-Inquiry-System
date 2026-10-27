"use client";
import { useEffect, useMemo, useState } from "react";
import { saveFollowUp, type SaveInput } from "@/app/dashboard/followups/actions";

export type Hist = { when: string; comment: string; outcome: string; by: string; next: string };
export type Row = {
  id: string; student: string; klass: string; board: string; mobile: string; source: string;
  status: string; nextFollowUp: string; created: string; history: Hist[];
};
type Tab = "overdue" | "today" | "upcoming" | "new";

const OPEN = ["New", "Repeat", "Contacted", "Follow-up", "Demo/Visit"];
const STATUSES = ["Contacted", "Follow-up", "Demo/Visit", "Admitted", "Lost"];
const OUTCOMES = ["Answered", "No answer", "Call back later", "Interested", "Not interested", "Visit scheduled"];
const LOST = ["Fees", "Distance", "Joined elsewhere", "Other"];
const TABS: [Tab, string][] = [["overdue", "Overdue"], ["today", "Today"], ["upcoming", "Upcoming"], ["new", "New"]];

const addDays = (d: string, n: number) => {
  const t = new Date(d + "T00:00:00Z");
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
};
const nowLocalInput = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};
const fmt = (d: string) =>
  d ? new Date(d.slice(0, 10) + "T00:00:00Z").toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" }) : "";

function bucketOf(r: Row, today: string): Tab | null {
  if (!OPEN.includes(r.status)) return null;
  const d = r.nextFollowUp.slice(0, 10);
  if (!d) return "new";
  return d < today ? "overdue" : d === today ? "today" : "upcoming";
}

function group(items: Row[], today: string) {
  const g: Record<Tab, Row[]> = { overdue: [], today: [], upcoming: [], new: [] };
  for (const r of items) { const b = bucketOf(r, today); if (b) g[b].push(r); }
  (["overdue", "today", "upcoming"] as Tab[]).forEach((t) => g[t].sort((a, b) => a.nextFollowUp.localeCompare(b.nextFollowUp)));
  g.new.sort((a, b) => b.created.localeCompare(a.created));
  return g;
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick}
      className={`rounded-xl border px-3 py-2 text-sm font-medium ${on ? "border-indigo-600 bg-indigo-50 text-indigo-800" : "border-slate-200 bg-white text-slate-700"}`}>
      {children}
    </button>
  );
}

function Drawer({ row, staff, today, onClose, onSave }: {
  row: Row; staff: string[]; today: string; onClose: () => void; onSave: (p: SaveInput) => void;
}) {
  const [by, setBy] = useState("");
  const [when, setWhen] = useState(nowLocalInput);
  const [outcome, setOutcome] = useState("");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState(STATUSES.includes(row.status) ? row.status : "Contacted");
  const [lost, setLost] = useState("");
  const [next, setNext] = useState(addDays(today, 1));
  const [err, setErr] = useState("");

  useEffect(() => { try { setBy(localStorage.getItem("beacon_by") ?? ""); } catch {} }, []);
  const closed = status === "Admitted" || status === "Lost";
  const field = "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-base focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200";
  const lbl = "mb-1.5 block text-sm font-semibold text-slate-900";

  function submit() {
    if (!by.trim()) return setErr("Select who made the call");
    if (!outcome) return setErr("Select the call outcome");
    if (status === "Lost" && !lost) return setErr("Select a lost reason");
    if (!closed && !/^\d{4}-\d{2}-\d{2}$/.test(next)) return setErr("Set the next follow-up date");
    try { localStorage.setItem("beacon_by", by.trim()); } catch {}
    onSave({
      enquiryId: row.id, by: by.trim(), when: when.replace("T", " "), outcome,
      comment: comment.trim(), status, lostReason: status === "Lost" ? lost : "", next: closed ? "" : next,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40" onClick={onClose}>
      <div className="mt-12 w-full overflow-y-auto rounded-t-3xl bg-white p-5 sm:mt-0 sm:max-w-md sm:rounded-none" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{row.student}</h2>
            <p className="text-sm text-slate-500">{row.klass} · {row.board || "board n/a"} · {row.mobile}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-lg px-2 text-2xl text-slate-500">×</button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Called by</label>
              {staff.length ? (
                <select value={by} onChange={(e) => setBy(e.target.value)} className={field}>
                  <option value="">Select name</option>
                  {staff.map((s) => <option key={s}>{s}</option>)}
                </select>
              ) : (
                <input value={by} onChange={(e) => setBy(e.target.value)} placeholder="Your name" className={field} />
              )}
            </div>
            <div>
              <label className={lbl}>Call date &amp; time</label>
              <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className={field} />
            </div>
          </div>

          <div>
            <span className={lbl}>Outcome</span>
            <div className="flex flex-wrap gap-2">{OUTCOMES.map((o) => <Chip key={o} on={outcome === o} onClick={() => setOutcome(o)}>{o}</Chip>)}</div>
          </div>

          <div>
            <label className={lbl}>Comment</label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} maxLength={500} placeholder="What did the parent say?" className={field} />
          </div>

          <div>
            <span className={lbl}>Status</span>
            <div className="flex flex-wrap gap-2">{STATUSES.map((s) => <Chip key={s} on={status === s} onClick={() => setStatus(s)}>{s}</Chip>)}</div>
          </div>

          {status === "Lost" && (
            <div>
              <span className={lbl}>Lost reason</span>
              <div className="flex flex-wrap gap-2">{LOST.map((s) => <Chip key={s} on={lost === s} onClick={() => setLost(s)}>{s}</Chip>)}</div>
            </div>
          )}

          {!closed && (
            <div>
              <span className={lbl}>Next follow-up</span>
              <div className="mb-2 flex flex-wrap gap-2">
                <Chip on={next === addDays(today, 1)} onClick={() => setNext(addDays(today, 1))}>Tomorrow</Chip>
                <Chip on={next === addDays(today, 3)} onClick={() => setNext(addDays(today, 3))}>3 days</Chip>
                <Chip on={next === addDays(today, 7)} onClick={() => setNext(addDays(today, 7))}>1 week</Chip>
              </div>
              <input type="date" value={next} min={today} onChange={(e) => setNext(e.target.value)} className={field} />
            </div>
          )}

          {err && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{err}</p>}
          <button onClick={submit} className="w-full rounded-xl bg-indigo-600 py-3.5 font-semibold text-white hover:bg-indigo-700">Save follow-up</button>
        </div>

        <h3 className="mb-3 mt-8 font-bold text-slate-900">History</h3>
        {row.history.length === 0 && <p className="text-sm text-slate-400">No calls logged yet</p>}
        <ul className="space-y-3">
          {row.history.map((h, i) => (
            <li key={i} className="rounded-xl bg-slate-50 p-3 text-sm">
              <p className="font-semibold text-slate-900">{h.outcome} <span className="font-normal text-slate-500">· {h.by} · {h.when}</span></p>
              {h.comment && <p className="mt-1 text-slate-700">{h.comment}</p>}
              {h.next && <p className="mt-1 text-slate-500">Next: {fmt(h.next)}</p>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function FollowUpBoard({ rows, staff, today }: { rows: Row[]; staff: string[]; today: string }) {
  const [items, setItems] = useState(rows);
  useEffect(() => setItems(rows), [rows]);
  const g = useMemo(() => group(items, today), [items, today]);
  const [tab, setTab] = useState<Tab>(() => {
    const first = group(rows, today);
    return (["overdue", "today", "new", "upcoming"] as Tab[]).find((t) => first[t].length) ?? "today";
  });
  const [openId, setOpenId] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const current = items.find((r) => r.id === openId) ?? null;

  async function handleSave(row: Row, p: SaveInput) {
    const prev = items;
    const entry: Hist = { when: p.when, comment: p.comment, outcome: p.outcome, by: p.by, next: p.next };
    // Optimistic: update the screen now, sync to the sheet in the background
    setItems((cur) => cur.map((r) => (r.id === row.id ? { ...r, status: p.status, nextFollowUp: p.next, history: [entry, ...r.history] } : r)));
    setOpenId(null);
    const res = await saveFollowUp(p);
    if (!res.ok) { setItems(prev); setToast(res.error ?? "Could not save"); }
    else setToast("Saved");
    setTimeout(() => setToast(""), 3500);
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        {TABS.map(([t, name]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold ${tab === t ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-white text-slate-700"}`}>
            {name} <span className={`ml-1 rounded-full px-2 py-0.5 text-xs ${tab === t ? "bg-white/20" : t === "overdue" && g[t].length ? "bg-red-100 text-red-700" : "bg-slate-100"}`}>{g[t].length}</span>
          </button>
        ))}
      </div>

      <ul className="mt-4 space-y-3">
        {g[tab].map((r) => {
          const last = r.history[0];
          return (
            <li key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-slate-900">{r.student} <span className="font-normal text-slate-500">· {r.klass}{r.board ? ` · ${r.board}` : ""}</span></p>
                  <p className="text-sm text-slate-600">{r.mobile}{r.source ? ` · ${r.source}` : ""}</p>
                  {last && <p className="mt-1 truncate text-sm text-slate-500">Last: {last.outcome}{last.comment ? ` – ${last.comment}` : ""} ({last.by})</p>}
                </div>
                {r.nextFollowUp && (
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tab === "overdue" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"}`}>{fmt(r.nextFollowUp)}</span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold">
                <a href={`tel:+91${r.mobile}`} className="rounded-xl border border-slate-200 px-4 py-2 text-indigo-700">Call</a>
                <a href={`https://wa.me/91${r.mobile}`} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-slate-200 px-4 py-2 text-indigo-700">WhatsApp</a>
                <button onClick={() => setOpenId(r.id)} className="rounded-xl bg-indigo-600 px-4 py-2 text-white">Update</button>
              </div>
            </li>
          );
        })}
        {g[tab].length === 0 && <li className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400">Nothing here</li>}
      </ul>

      {current && <Drawer key={current.id} row={current} staff={staff} today={today} onClose={() => setOpenId(null)} onSave={(p) => handleSave(current, p)} />}
      {toast && <div role="status" className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-5 py-3 text-sm text-white">{toast}</div>}
    </div>
  );
}
