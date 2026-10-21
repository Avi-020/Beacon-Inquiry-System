import "server-only";
import { google } from "googleapis";

// Preferred: GOOGLE_CREDENTIALS_BASE64 = the whole service-account JSON file, base64 encoded.
// This avoids newline/quote problems with the private key.
// Fallback: GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY.
function credentials() {
  const b64 = process.env.GOOGLE_CREDENTIALS_BASE64;
  if (b64) {
    const j = JSON.parse(Buffer.from(b64.trim(), "base64").toString("utf8"));
    return { email: j.client_email as string, key: j.private_key as string };
  }
  return {
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: (process.env.GOOGLE_PRIVATE_KEY ?? "")
      .trim()
      .replace(/^["']|["']$/g, "")
      .replace(/\\n/g, "\n"),
  };
}
// Built on first use, so a bad env var can never crash the whole page.
let cached: ReturnType<typeof google.sheets> | null = null;
function getSheets() {
  if (cached) return cached;
  const { email, key } = credentials();
  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  cached = google.sheets({ version: "v4", auth });
  return cached;
}
const SHEET_ID = process.env.GOOGLE_SHEET_ID!;

export type NewEnquiry = {
  student: string;
  mobile: string;
  mobile2: string;
  klass: string;
  board: string;
  school: string;
  lastYearPct: string;
  source: string;
};

const nowIST = () =>
  new Date().toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" }); // 2026-10-17 14:05:09

const makeId = () =>
  "BCN-" +
  Date.now().toString(36).toUpperCase() +
  Math.random().toString(36).slice(2, 4).toUpperCase();

// One cheap read: only the Mobile column (D)
export async function mobileExists(mobile: string): Promise<boolean> {
  const res = await getSheets().spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "Enquiries!D2:D",
  });
  return (res.data.values ?? []).some((r) => r[0] === mobile);
}

// Columns: ID, Created at, Student, Mobile, Mobile 2, Class, Board, School,
// Last year %, Source, Status, Assigned to, Next follow-up date, Last updated
export async function appendEnquiry(e: NewEnquiry, status: "New" | "Repeat") {
  const now = nowIST();
  await getSheets().spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: "Enquiries!A1",
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [
        [
          makeId(),
          now,
          e.student,
          e.mobile,
          e.mobile2,
          e.klass,
          e.board,
          e.school,
          e.lastYearPct,
          e.source,
          status,
          "",
          "",
          now,
        ],
      ],
    },
  });
}
// All enquiry rows (A..N), header excluded. Used by the dashboard.
export async function readEnquiryRows(): Promise<string[][]> {
  const res = await getSheets().spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "Enquiries!A2:N",
  });
  return (res.data.values ?? []) as string[][];
}
