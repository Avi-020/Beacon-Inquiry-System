"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { logout, refresh } from "@/app/dashboard/actions";

type Due = { overdue: number; today: number; fresh: number };

export default function TopBar({ due }: { due: Due }) {
  const path = usePathname();
  const router = useRouter();
  const count = due.overdue + due.today + due.fresh;
  const onFollowups = path.startsWith("/dashboard/followups");

  // Tab title badge: "(8) Beacon"
  useEffect(() => {
    const t = setTimeout(() => { document.title = (count ? `(${count}) ` : "") + "Beacon"; }, 50);
    return () => clearTimeout(t);
  }, [count, path]);

  // Auto-refresh while the portal is open and visible
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 60000);
    return () => clearInterval(t);
  }, [router]);

  const link = (href: string, text: string, active: boolean) => (
    <Link href={href} className={`rounded-xl px-4 py-2 text-sm font-semibold ${active ? "bg-indigo-50 text-indigo-800" : "text-slate-600 hover:bg-slate-100"}`}>{text}</Link>
  );
  const btn = "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700";

  return (
    <div className="mx-auto max-w-6xl px-4 pt-4">
      <nav className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="mr-2 flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white">B</span>
          {link("/dashboard", "Overview", path === "/dashboard")}
          {link("/dashboard/followups", "Follow-ups", onFollowups)}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/followups" aria-label={`${count} calls to make`} className="relative rounded-xl border border-slate-200 bg-white p-2.5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-700">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
            {count > 0 && (
              <span className={`absolute -right-1.5 -top-1.5 min-w-5 rounded-full px-1.5 text-center text-xs font-bold text-white ${due.overdue ? "bg-red-600" : "bg-indigo-600"}`}>{count}</span>
            )}
          </Link>
          <form action={refresh}><button className={btn}>Refresh</button></form>
          <form action={logout}><button className={btn}>Logout</button></form>
        </div>
      </nav>

      {count > 0 && !onFollowups && (
        <Link href="/dashboard/followups" className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-900">
          <span>
            <b>Calls to make:</b>{" "}
            {[due.overdue && `${due.overdue} overdue`, due.today && `${due.today} due today`, due.fresh && `${due.fresh} not called yet`].filter(Boolean).join(" · ")}
          </span>
          <span className="font-semibold">Open follow-ups →</span>
        </Link>
      )}
    </div>
  );
}
