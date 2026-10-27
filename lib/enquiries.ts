import "server-only";
import { getSheets, SHEET_ID } from "@/lib/sheets";

const nowIST = () => new Date().toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" });

// Updates Student..Source (C:J) and Last updated (N). Row is found by ID, not by position.
export async function writeEnquiryDetails(f: {
  id: string; student: string; mobile: string; mobile2: string; klass: string;
  board: string; school: string; pct: string; source: string;
}) {
  const sheets = getSheets();
  const ids = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: "Enquiries!A2:A" });
  const idx = (ids.data.values ?? []).findIndex((r) => r[0] === f.id);
  if (idx < 0) throw new Error("Enquiry not found: " + f.id);
  const row = idx + 2;
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      valueInputOption: "RAW",
      data: [
        { range: `Enquiries!C${row}:J${row}`, values: [[f.student, f.mobile, f.mobile2, f.klass, f.board, f.school, f.pct, f.source]] },
        { range: `Enquiries!N${row}`, values: [[nowIST()]] },
      ],
    },
  });
}
