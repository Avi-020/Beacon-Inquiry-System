"use client";
import { useActionState, useEffect, useState } from "react";
import { submitEnquiry, type FormState } from "@/app/actions";

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
const MOBILE = /^[6-9]\d{9}$/;
const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ""; // e.g. 919XXXXXXXXX

const input =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200";
const label = "mb-1.5 block text-sm font-semibold text-slate-900";
const err = "mt-1 text-sm text-red-600";

function Chips({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={value === o}
          onClick={() => onChange(value === o ? "" : o)}
          className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
            value === o
              ? "border-indigo-600 bg-indigo-50 text-indigo-800"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export default function EnquiryForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    submitEnquiry,
    { ok: false },
  );
  const [student, setStudent] = useState("");
  const [mobile, setMobile] = useState("");
  const [mobile2, setMobile2] = useState("");
  const [klass, setKlass] = useState("");
  const [board, setBoard] = useState("");
  const [hear, setHear] = useState("");
  const [src, setSrc] = useState("");
  const [tried, setTried] = useState(false);

  // Read ?src=poster|instagram client-side so the page can stay static (fast)
  useEffect(() => {
    setSrc(new URLSearchParams(window.location.search).get("src") ?? "");
  }, []);

  // Keeps digits only; handles pasted "+91 98765 43210" and "098765 43210"
  const digits = (v: string) => {
    let d = v.replace(/\D/g, "");
    if (d.length > 10 && d.startsWith("91")) d = d.slice(2);
    if (d.length > 10 && d.startsWith("0")) d = d.slice(1);
    return d.slice(0, 10);
  };
  const bad = {
    student: student.trim().length < 2,
    mobile: !MOBILE.test(mobile),
    mobile2: mobile2 !== "" && !MOBILE.test(mobile2),
    klass: !klass,
  };

  if (state.ok) {
    const msg = encodeURIComponent(
      `Hello Beacon, I submitted an admission enquiry for ${student}.`,
    );
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700">
          ✓
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Thank you!</h2>
        <p className="mt-2 text-slate-600">
          We have your enquiry for {student}. Our team will call you back soon.
        </p>
        {WHATSAPP && (
          <a
            href={`https://wa.me/${WHATSAPP}?text=${msg}`}
            className="mt-6 inline-block rounded-xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
          >
            Chat on WhatsApp
          </a>
        )}
      </div>
    );
  }

  return (
    <form
      action={action}
      noValidate
      onSubmit={(e) => {
        if (Object.values(bad).some(Boolean)) {
          e.preventDefault();
          setTried(true);
          const first = bad.student
            ? "student"
            : bad.mobile
              ? "mobile"
              : bad.mobile2
                ? "mobile2"
                : null;
          if (first) document.getElementById(first)?.focus();
          else
            document
              .getElementById("class-group")
              ?.scrollIntoView({ block: "center" });
        }
      }}
    >
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">
        Admission enquiry
      </h1>
      <p className="mt-1 text-slate-500">
        Takes about one minute. We will call you back.
      </p>

      {/* honeypot: hidden from people, bots fill it */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
      <input type="hidden" name="klass" value={klass} />
      <input type="hidden" name="board" value={board} />
      <input type="hidden" name="hear" value={hear} />
      <input type="hidden" name="src" value={src} />

      <div className="mt-6 space-y-5">
        <div>
          <label htmlFor="student" className={label}>
            Student name
          </label>
          <input
            id="student"
            name="student"
            autoComplete="name"
            placeholder="Full name"
            value={student}
            onChange={(e) => setStudent(e.target.value)}
            className={input}
          />
          {tried && bad.student && (
            <p className={err}>Enter the student&apos;s name</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="mobile" className={label}>
              Parent mobile
            </label>
            <div className="flex">
              <span className="flex items-center rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 px-3 text-slate-600">
                +91
              </span>
              <input
                id="mobile"
                name="mobile"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="10-digit number"
                value={mobile}
                onChange={(e) => setMobile(digits(e.target.value))}
                className={input + " rounded-l-none"}
              />
            </div>
            {tried && bad.mobile && (
              <p className={err}>
                Enter a 10-digit number starting with 6, 7, 8 or 9
              </p>
            )}
          </div>
          <div>
            <label htmlFor="mobile2" className={label}>
              Second number{" "}
              <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <div className="flex">
              <span className="flex items-center rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 px-3 text-slate-600">
                +91
              </span>
              <input
                id="mobile2"
                name="mobile2"
                type="tel"
                inputMode="tel"
                placeholder="10-digit number"
                value={mobile2}
                onChange={(e) => setMobile2(digits(e.target.value))}
                className={input + " rounded-l-none"}
              />
            </div>
            {tried && bad.mobile2 && (
              <p className={err}>
                Enter a 10-digit number starting with 6, 7, 8 or 9
              </p>
            )}
          </div>
        </div>

        <div>
          <span id="class-group" className={label}>
            Enquiry for class
          </span>
          <Chips options={CLASSES} value={klass} onChange={setKlass} />
          {tried && bad.klass && <p className={err}>Select a class</p>}
        </div>

        <div>
          <span className={label}>
            Board <span className="font-normal text-slate-400">(optional)</span>
          </span>
          <Chips options={BOARDS} value={board} onChange={setBoard} />
        </div>

        <div className="grid grid-cols-[1fr_8rem] gap-4">
          <div>
            <label htmlFor="school" className={label}>
              School name
            </label>
            <input
              id="school"
              name="school"
              placeholder="Current school"
              className={input}
            />
          </div>
          <div>
            <label htmlFor="pct" className={label}>
              Last year %
            </label>
            <input
              id="pct"
              name="pct"
              inputMode="decimal"
              placeholder="e.g. 93.5"
              className={input}
            />
          </div>
        </div>

        <div>
          <span className={label}>
            How did you hear about us?{" "}
            <span className="font-normal text-slate-400">(optional)</span>
          </span>
          <Chips options={SOURCES} value={hear} onChange={setHear} />
        </div>

        {tried && Object.values(bad).some(Boolean) && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            Please fix the highlighted fields above.
          </p>
        )}
        {state.error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-indigo-600 py-3.5 text-base font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
        >
          {pending ? "Sending…" : "Submit enquiry"}
        </button>
        <p className="text-center text-xs text-slate-500">
          Beacon, Sun City, Ambegaon, Pune
        </p>
      </div>
    </form>
  );
}
