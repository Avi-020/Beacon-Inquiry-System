import type { Enquiry } from "@/lib/data";

export type SP = Record<string, string | string[] | undefined>;
export type Params = { q?: string; cls?: string; status?: string; src?: string; from?: string; to?: string; page?: string };

export const STATUS_LIST = ["New", "Repeat", "Contacted", "Follow-up", "Demo/Visit", "Admitted", "Lost"];
export const STATUS_STYLE: Record<string, string> = {
  New: "bg-indigo-100 text-indigo-800",
  Repeat: "bg-orange-100 text-orange-800",
  Contacted: "bg-sky-100 text-sky-800",
  "Follow-up": "bg-amber-100 text-amber-800",
  "Demo/Visit": "bg-violet-100 text-violet-800",
  Admitted: "bg-green-100 text-green-800",
  Lost: "bg-slate-200 text-slate-700",
};

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const date = (v: string) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "");

export function parseParams(sp: SP): Params {
  return {
    q: one(sp.q).trim().slice(0, 60), cls: one(sp.cls), status: one(sp.status), src: one(sp.src),
    from: date(one(sp.from)), to: date(one(sp.to)), page: one(sp.page),
  };
}

// Newest first
export function filterEnquiries(all: Enquiry[], p: Params): Enquiry[] {
  const q = (p.q ?? "").toLowerCase();
  const digits = q.replace(/\D/g, "");
  return all
    .filter((e) => {
      if (q) {
        const hit =
          e.student.toLowerCase().includes(q) || e.school.toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q) ||
          (digits.length >= 3 && (e.mobile.includes(digits) || e.mobile2.includes(digits)));
        if (!hit) return false;
      }
      if (p.cls && e.klass !== p.cls) return false;
      if (p.status && e.status !== p.status) return false;
      if (p.src && (p.src === "_none" ? e.source !== "" : e.source !== p.src)) return false;
      const d = e.created.slice(0, 10);
      if (p.from && d < p.from) return false;
      if (p.to && d > p.to) return false;
      return true;
    })
    .reverse();
}
