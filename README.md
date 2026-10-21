# Beacon Enquiry System

## 1. Google Sheet
Create a spreadsheet with 3 tabs (exact names). Put these headers in row 1.

**Enquiries** (A to N):
ID | Created at | Student | Mobile | Mobile 2 | Class | Board | School | Last year % | Source | Status | Assigned to | Next follow-up date | Last updated

**FollowUps** (A to G):
ID | Enquiry ID | Date | Comment | Next follow-up date | Outcome | By

**Settings**: leave empty for now.

Tip: select columns D and E in Enquiries, then Format > Number > Plain text.

## 2. Service account
1. console.cloud.google.com: create a project, then enable **Google Sheets API**.
2. IAM & Admin > Service Accounts > Create. Then Keys > Add key > JSON. A file downloads.
3. Open your sheet > Share > paste the service account `client_email` > **Editor**.
4. Copy the Sheet ID from the URL: docs.google.com/spreadsheets/d/**THIS_PART**/edit

## 3. Run
```
npm install
cp .env.example .env.local   # fill the 4 values
npm run dev
```
Open http://localhost:3000. Test links: `/?src=poster`, `/?src=instagram`.

## 4. Deploy
Push to GitHub, import in Vercel and add the same 4 env vars. `vercel.json` already sets the Mumbai region (`bom1`).
# Beacon-Inquiry-System
