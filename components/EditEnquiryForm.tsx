"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateEnquiry,
  type EditInput,
} from "@/app/dashboard/enquiries/actions";

const CLASSES = ["8th", "9th", "10th", "11th", "12th"];
const BOARDS = ["CBSE", "SSC", "ICSE"];
const SOURCES = [
  "Friends / Family",
  "Social media",
  "Google",
  "Advertisement",
  "Seminar / Event",
  "Other",
];
const digits = (v: string) => v.replace(/\D/g, "").slice(0, 10);
const field =
  "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-base focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200";
const lbl = "mb-1 block text-xs font-semibold text-slate-600";

export default function EditEnquiryForm({ initial }: { initial: EditInput }) {
  const router = useRouter();
  const [f, setF] = useState(initial);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  const set = (k: keyof EditInput) => (v: string) =>
    setF((s) => ({ ...s, [k]: v }));

  function save() {
    setMsg("");
    setErr("");
    if (f.student.trim().length < 2) return setErr("Enter the student's name");
    if (!/^[6-9]\d{9}$/.test(f.mobile))
      return setErr("Mobile must be 10 digits starting with 6, 7, 8 or 9");
    if (f.mobile2 && !/^[6-9]\d{9}$/.test(f.mobile2))
      return setErr("Second number must be 10 digits starting with 6-9");
    start(async () => {
      const res = await updateEnquiry(f);
      if (res.ok) {
        setMsg("Saved");
        router.refresh();
      } else setErr(res.error ?? "Could not save");
    });
  }

  return (
    <div className="space-y-3">
      <div>
        <label className={lbl} htmlFor="e-student">
          Student name
        </label>
        <input
          id="e-student"
          value={f.student}
          onChange={(e) => set("student")(e.target.value)}
          className={field}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl} htmlFor="e-mobile">
            Parent mobile
          </label>
          <input
            id="e-mobile"
            inputMode="tel"
            value={f.mobile}
            onChange={(e) => set("mobile")(digits(e.target.value))}
            className={field}
          />
        </div>
        <div>
          <label className={lbl} htmlFor="e-mobile2">
            Second number
          </label>
          <input
            id="e-mobile2"
            inputMode="tel"
            value={f.mobile2}
            onChange={(e) => set("mobile2")(digits(e.target.value))}
            className={field}
          />
        </div>
        <div>
          <label className={lbl} htmlFor="e-class">
            Class
          </label>
          <select
            id="e-class"
            value={f.klass}
            onChange={(e) => set("klass")(e.target.value)}
            className={field}
          >
            {CLASSES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={lbl} htmlFor="e-board">
            Board
          </label>
          <select
            id="e-board"
            value={f.board}
            onChange={(e) => set("board")(e.target.value)}
            className={field}
          >
            <option value="">Not given</option>
            {BOARDS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-[1fr_6rem] gap-3">
        <div>
          <label className={lbl} htmlFor="e-school">
            School
          </label>
          <input
            id="e-school"
            value={f.school}
            onChange={(e) => set("school")(e.target.value)}
            className={field}
          />
        </div>
        <div>
          <label className={lbl} htmlFor="e-pct">
            Last year %
          </label>
          <input
            id="e-pct"
            inputMode="decimal"
            value={f.pct}
            onChange={(e) => set("pct")(e.target.value)}
            className={field}
          />
        </div>
      </div>
      <div>
        <label className={lbl} htmlFor="e-source">
          Source
        </label>
        <input
          id="e-source"
          list="e-sources"
          value={f.source}
          onChange={(e) => set("source")(e.target.value)}
          className={field}
        />
        <datalist id="e-sources">
          {SOURCES.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </div>
      {err && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {err}
        </p>
      )}
      {msg && (
        <p
          role="status"
          className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          {msg}
        </p>
      )}
      <button
        onClick={save}
        disabled={pending}
        className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}
