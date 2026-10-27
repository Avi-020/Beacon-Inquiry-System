import "server-only";
import { unstable_cache } from "next/cache";
import { getSheets, SHEET_ID } from "@/lib/sheets";

export type FollowUp = {
  id: string; enquiryId: string; when: string; comment: string;
  next: string; outcome: string; by: string;
};

const nowIST = () => new Date().toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" });

// FollowUps columns: ID, Enquiry ID, Date, Comment, Next follow-up date, Outcome, By
export const getFollowUps = unstable_cache(
  async (): Promise<FollowUp[]> => {
    const res = await getSheets().spreadsheets.values.get({
      spreadsheetId: SHEET_ID, range: "FollowUps!A2:G",
    });
    return ((res.data.values ?? []) as string[][])
      .filter((r) => r[1])
      .map((r) => ({
        id: r[0] ?? "", enquiryId: r[1] ?? "", when: r[2] ?? "", comment: r[3] ?? "",
        next: r[4] ?? "", outcome: r[5] ?? "", by: r[6] ?? "",
      }));
  },
  ["followups"],
  { revalidate: 60, tags: ["followups"] }
);

// Staff names live in Settings, column D (Users), from D2 down.
export const getStaff = unstable_cache(
  async (): Promise<string[]> => {
    const res = await getSheets().spreadsheets.values.get({
      spreadsheetId: SHEET_ID, range: "Settings!D2:D",
    });
    return ((res.data.values ?? []) as string[][]).map((r) => String(r[0] ?? "").trim()).filter(Boolean);
  },
  ["staff"],
  { revalidate: 300 }
);

export async function writeFollowUp(f: {
  enquiryId: string; by: string; when: string; outcome: string; comment: string;
  status: string; lostReason: string; next: string;
}) {
  const sheets = getSheets();
  // Find the row by ID (row numbers shift when the sheet is sorted)
  const ids = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: "Enquiries!A2:A" });
  const idx = (ids.data.values ?? []).findIndex((r) => r[0] === f.enquiryId);
  if (idx < 0) throw new Error("Enquiry not found: " + f.enquiryId);
  const row = idx + 2;
  const fuId = "FU-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 4).toUpperCase();

  await Promise.all([
    sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID, range: "FollowUps!A1",
      valueInputOption: "RAW", insertDataOption: "INSERT_ROWS",
      requestBody: { values: [[fuId, f.enquiryId, f.when, f.comment, f.next, f.outcome, f.by]] },
    }),
    sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        valueInputOption: "RAW",
        data: [
          { range: `Enquiries!K${row}`, values: [[f.status]] },
          { range: `Enquiries!M${row}:O${row}`, values: [[f.next, nowIST(), f.lostReason]] },
        ],
      },
    }),
  ]);
}
