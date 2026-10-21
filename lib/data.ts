import "server-only";
import { unstable_cache } from "next/cache";
import { readEnquiryRows } from "@/lib/sheets";

export type Enquiry = {
  id: string; created: string; student: string; mobile: string; mobile2: string;
  klass: string; board: string; school: string; pct: string; source: string;
  status: string; assignedTo: string; nextFollowUp: string; updated: string;
};

// ONE sheet read, shared by every dashboard visit for 60 s (and across Vercel instances).
// The form submit calls revalidateTag("enquiries") so new rows show up quickly.
export const getEnquiries = unstable_cache(
  async (): Promise<Enquiry[]> => {
    const rows = await readEnquiryRows();
    return rows
      .filter((r) => r[0])
      .map((r) => ({
        id: r[0] ?? "", created: r[1] ?? "", student: r[2] ?? "", mobile: r[3] ?? "",
        mobile2: r[4] ?? "", klass: r[5] ?? "", board: r[6] ?? "", school: r[7] ?? "",
        pct: r[8] ?? "", source: r[9] ?? "", status: r[10] || "New",
        assignedTo: r[11] ?? "", nextFollowUp: r[12] ?? "", updated: r[13] ?? "",
      }));
  },
  ["enquiries"],
  { revalidate: 60, tags: ["enquiries"] }
);
