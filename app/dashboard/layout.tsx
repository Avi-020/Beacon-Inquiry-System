import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE, verifySession } from "@/lib/session";
import { getEnquiries } from "@/lib/data";
import { computeDue } from "@/lib/stats";
import TopBar from "@/components/TopBar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await verifySession((await cookies()).get(COOKIE)?.value)))
    redirect("/login");
  let due = { overdue: 0, today: 0, fresh: 0 };
  try {
    due = computeDue(await getEnquiries()); // same cached read as the pages: no extra Sheets call
  } catch {}
  return (
    <>
      <TopBar due={due} />
      {children}
    </>
  );
}
