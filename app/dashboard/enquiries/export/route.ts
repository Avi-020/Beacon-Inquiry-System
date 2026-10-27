import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { COOKIE, verifySession } from "@/lib/session";
import { getEnquiries } from "@/lib/data";
import { filterEnquiries, parseParams } from "@/lib/filter";

// Stops spreadsheet apps from running a cell as a formula (e.g. a name starting with "=")
const cell = (v: string) => {
  const t = /^[=+\-@\t\r]/.test(v) ? "'" + v : v;
  return `"${t.replace(/"/g, '""')}"`;
};

export async function GET(req: NextRequest) {
  if (!(await verifySession((await cookies()).get(COOKIE)?.value))) {
    return new Response("Unauthorized", { status: 401 });
  }
  const p = parseParams(Object.fromEntries(req.nextUrl.searchParams));
  const list = filterEnquiries(await getEnquiries(), p);

  const head = ["ID", "Created at", "Student", "Mobile", "Mobile 2", "Class", "Board", "School",
    "Last year %", "Source", "Status", "Assigned to", "Next follow-up date", "Last updated", "Lost reason"];
  const lines = [head.map(cell).join(",")];
  for (const e of list) {
    lines.push([e.id, e.created, e.student, e.mobile, e.mobile2, e.klass, e.board, e.school, e.pct,
      e.source, e.status, e.assignedTo, e.nextFollowUp, e.updated, e.lostReason].map(cell).join(","));
  }
  const day = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Kolkata" });
  return new Response("\uFEFF" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="beacon-enquiries-${day}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
