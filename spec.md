# InvoicePro — Product Spec

## 1. Overview

InvoicePro is a web application (mobile app planned for a later phase, not in current scope) that acts as an **invoice follow-up and payment-risk tracker**. It helps businesses see which invoices are overdue, how risky each unpaid invoice is, and what to do next to get paid — without requiring integration with an accounting system.

The core value is **visibility and workflow management**, not automation. AI-assisted message generation is a nice-to-have layer on top; the product must remain fully useful without it.

## 2. Target Users

- Small IT-services firms
- Digital agencies
- Freelance consultants
- Small manufacturers
- Staffing firms

These users typically invoice clients on net-30/net-60 terms, chase payments manually, and lack a simple way to see overall receivables risk.

## 3. Scope

### 3.1 Standalone by design

InvoicePro does **not** integrate with external accounting/invoicing tools (e.g., QuickBooks, Xero, Stripe) in this phase. All invoice data enters the system via manual CSV import.

### 3.2 MVP Workflow

1. User uploads a CSV of invoices.
2. The system validates and imports the records.
3. The system calculates invoice age, due date, days overdue, and risk status.
4. Dashboard displays outstanding receivables.
5. System generates a suggested follow-up message per invoice.
6. User marks an invoice as followed up or paid.
7. System displays a basic cash-flow forecast.

### 3.3 Example Invoice Record

```
Invoice: INV-1042
Customer: Acme Technologies
Amount: ₹185,000
Invoice date: 2026-08-01
Due date: 2026-08-31
Status: Unpaid
Last follow-up: 2026-09-08
```

Derived dashboard view for this record:

```
Overdue by: 13 days
Risk: High
Recommended action: Send payment reminder and escalate to account owner
```

## 4. Core Screens

Only five screens in the MVP.

### 4.1 Dashboard
- Total outstanding
- Overdue amount
- Due in the next 7 days
- Expected collections this week
- High-risk customers

### 4.2 Invoice List
- Search and filter by customer, status, age, amount, and risk

### 4.3 Invoice Detail
- Invoice information
- Payment history
- Follow-up history
- Suggested next action

### 4.4 Import Page
- CSV upload
- Validation errors
- Import summary

### 4.5 Follow-up Assistant
- Generates a concise reminder
- Offers polite, firm, and escalation versions
- Allows the user to copy the message

## 5. Risk & Status Logic

- **Days overdue** = today − due date (if unpaid and past due).
- **Risk level**: a customer is flagged **High risk** if they have defaulted (paid late or not paid) on more than 2 prior invoices. Otherwise risk is **Low**.
- **Recommended action** maps to risk level (e.g., Low → standard reminder, High → firm reminder / escalation).

## 6. Cash-Flow Forecast

- Projected collections for the current month are calculated based on invoice data from the past two weeks (simple trend-based projection).

## 7. Follow-up Message Generation

- May use an LLM to draft reminder messages.
- Must offer three tones: polite, firm, escalation.
- Product must remain fully functional (with template-based or rule-based fallback messages) if AI generation is unavailable.

## 8. Tech Stack (POC)

- **Frontend**: React (Vite) + Tailwind CSS — fast to scaffold the five screens with minimal boilerplate.
- **Backend**: Next.js API routes — keeps frontend and backend in a single app, minimizing moving parts for a POC.
- **Database**: SQLite (via Prisma) — zero setup, sufficient for POC-scale invoice data, easy to swap for Postgres later.
- **CSV parsing**: `papaparse` or `csv-parse`.
- **LLM (optional follow-up messages)**: Claude API, called server-side, with a template-based fallback per Section 7.

## 9. Acceptance Criteria

### 9.1 CSV Import
- User can upload a CSV file from the Import page.
- Valid rows are imported and become visible in the Invoice List.
- Rows with missing/invalid required fields (invoice ID, customer, amount, invoice date, due date, status) are rejected and listed as validation errors, without blocking import of the valid rows.
- After import, a summary shows counts of rows imported successfully and rows rejected.

### 9.2 Invoice Calculations
- For every unpaid invoice, days overdue = today − due date (0 or blank if not yet due).
- A customer is marked **High risk** if they have defaulted (paid late or unpaid past due date) on more than 2 prior invoices; otherwise **Low risk**.
- Each invoice shows a recommended action consistent with its risk level (Low → standard reminder, High → firm reminder/escalation).

### 9.3 Dashboard
- Dashboard displays: total outstanding, overdue amount, amount due in the next 7 days, expected collections this week, and a list of high-risk customers.
- Figures update after a new CSV import or after an invoice status change (e.g., marked paid).

### 9.4 Invoice List
- User can search invoices by customer name/invoice ID.
- User can filter by status, age (days overdue), amount, and risk level.
- Filtered/search results match the underlying invoice data exactly (no stale results).

### 9.5 Invoice Detail
- Selecting an invoice from the list opens a detail view showing invoice information, payment history, follow-up history, and the suggested next action.
- User can mark the invoice as "followed up" or "paid" from this screen, and the change is reflected immediately in the Dashboard and Invoice List.

### 9.6 Follow-up Assistant
- User can generate a follow-up message for a given invoice in three tones: polite, firm, and escalation.
- User can copy the generated message to the clipboard.
- If the LLM is unavailable or not configured, the assistant still returns a usable template-based message in each of the three tones.

### 9.7 Cash-Flow Forecast
- Dashboard/forecast view shows a projected collections figure for the current month, computed from the past two weeks of invoice data.
- Forecast recalculates after new invoices are imported or invoice statuses change.

## 10. Non-Goals (for this phase)

- No mobile app (planned later).
- No integrations with external accounting/invoicing/payment platforms.
- No automated sending of follow-up emails (user copies the message manually).
- No multi-tenant / team roles beyond what's needed for a single business account (roles/teams not yet specified).
- No audit trail for follow-up/paid status changes — a simple current-status update is sufficient.

## 11. Open Questions

- User/account model (single user vs. team with roles) — not yet decided.
