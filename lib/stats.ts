import type { Enquiry } from "@/lib/data";

export const OPEN = ["New", "Repeat", "Contacted", "Follow-up", "Demo/Visit"];
export const CLASSES = ["8th", "9th", "10th", "11th", "12th"];

export const todayIST = () =>
  new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Kolkata" });
const dayNum = (d: string) => Math.floor(Date.parse(d.slice(0, 10) + "T00:00:00Z") / 864e5);

export const label = (s: string) =>
  !s ? "Direct / unknown" : s.replace(/[-_]/g, " ").replace(/^./, (c) => c.toUpperCase());

const countBy = (list: Enquiry[], f: (e: Enquiry) => string) => {
  const m = new Map<string, number>();
  list.forEach((e) => m.set(f(e), (m.get(f(e)) ?? 0) + 1));
  return m;
};

export function computeStats(all: Enquiry[], range: "month" | "all") {
  const today = todayIST();
  const month = today.slice(0, 7);
  const [y, m] = month.split("-").map(Number);
  const prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;

  const inRange = range === "month" ? all.filter((e) => e.created.startsWith(month)) : all;
  const prevCount = all.filter((e) => e.created.startsWith(prev)).length;
  const admitted = inRange.filter((e) => e.status === "Admitted").length;
  const open = all.filter((e) => OPEN.includes(e.status));
  const overdue = open.filter((e) => e.nextFollowUp && e.nextFollowUp.slice(0, 10) < today).length;

  const weeks = [0, 0, 0, 0]; // last bar = most recent 7 days
  const t = dayNum(today);
  for (const e of all) {
    const diff = t - dayNum(e.created);
    if (diff >= 0 && diff < 28) weeks[3 - Math.floor(diff / 7)]++;
  }

  const sources = [...countBy(inRange, (e) => label(e.source))].sort((a, b) => b[1] - a[1]).slice(0, 7);
  const classMap = countBy(inRange, (e) => e.klass);
  const byClass = CLASSES.map((c) => [c, classMap.get(c) ?? 0] as [string, number]);

  return {
    total: inRange.length,
    deltaPct: range === "month" && prevCount > 0 ? Math.round(((inRange.length - prevCount) / prevCount) * 100) : null,
    openCount: open.length,
    overdue,
    admitted,
    conversion: inRange.length ? Math.round((admitted / inRange.length) * 100) : 0,
    weeks, sources, byClass,
    latest: [...all].reverse().slice(0, 10),
  };
}
