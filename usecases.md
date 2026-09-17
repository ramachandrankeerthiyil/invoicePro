# InvoicePro — Use Cases

Companion to [spec.md](spec.md). Covers the primary actor interactions for the MVP.

## Actor

- **User** — a single business user (freelancer, agency owner, accounts-receivable staff) managing their own invoices. No multi-role/team actors in this phase (see spec.md §11 Open Questions).

## UC1 — Import Invoices via CSV

**Goal**: Load invoice data into the system.

- **Preconditions**: User has a CSV file of invoices in the expected format.
- **Main flow**:
  1. User navigates to the Import page.
  2. User selects/uploads a CSV file.
  3. System validates each row (required fields: invoice ID, customer, amount, invoice date, due date, status).
  4. System imports all valid rows.
  5. System displays an import summary: rows imported, rows rejected.
- **Alternate flows**:
  - 3a. Some rows fail validation → system lists the specific errors per row (e.g., missing due date) but still imports the valid rows.
  - 3b. File is not a valid CSV → system shows a file-level error and imports nothing.
- **Postconditions**: Valid invoices appear in the Invoice List and are reflected in Dashboard figures.

## UC2 — View Dashboard

**Goal**: Get an at-a-glance view of receivables health.

- **Preconditions**: At least one invoice has been imported (otherwise dashboard shows zero/empty states).
- **Main flow**:
  1. User opens the Dashboard.
  2. System displays: total outstanding, overdue amount, due in next 7 days, expected collections this week, high-risk customers, and cash-flow forecast for the month.
- **Postconditions**: None (read-only view).

## UC3 — Search and Filter Invoices

**Goal**: Find specific invoices or subsets (e.g., all high-risk overdue invoices).

- **Preconditions**: Invoices exist in the system.
- **Main flow**:
  1. User opens the Invoice List.
  2. User enters a search term (customer name / invoice ID) and/or applies filters (status, age, amount, risk).
  3. System displays matching invoices.
- **Postconditions**: None (read-only view).

## UC4 — View Invoice Detail

**Goal**: Inspect a single invoice and decide on next action.

- **Preconditions**: Invoice exists.
- **Main flow**:
  1. User selects an invoice from the Invoice List.
  2. System displays invoice information, payment history, follow-up history, and a suggested next action.
- **Postconditions**: None (read-only view; see UC6 for status changes from this screen).

## UC5 — Generate a Follow-up Message

**Goal**: Get a ready-to-send reminder message for an invoice.

- **Preconditions**: User is viewing an invoice (Invoice Detail or Follow-up Assistant).
- **Main flow**:
  1. User requests a follow-up message for the invoice.
  2. System generates three versions: polite, firm, escalation (via LLM if available).
  3. User selects a version and copies it to the clipboard.
- **Alternate flows**:
  - 2a. LLM is unavailable/not configured → system falls back to template-based messages in the same three tones.
- **Postconditions**: A follow-up log entry is recorded for the invoice (timestamp + tone used), so it appears in follow-up history (UC4).

## UC6 — Mark Invoice as Followed Up or Paid

**Goal**: Keep invoice status current.

- **Preconditions**: Invoice exists and is unpaid.
- **Main flow**:
  1. From Invoice Detail (or Invoice List row action), user marks the invoice as "followed up" or "paid."
  2. System updates the invoice's current status (no historical audit trail is kept — see spec.md §10).
  3. Dashboard, Invoice List, and risk calculations refresh to reflect the change.
- **Postconditions**: If marked "paid," the invoice no longer counts toward outstanding/overdue totals. If it was paid late, it counts toward that customer's default count for future risk scoring.

## UC7 — View Cash-Flow Forecast

**Goal**: Understand expected collections for the month.

- **Preconditions**: At least two weeks of invoice data exists.
- **Main flow**:
  1. User views the forecast figure on the Dashboard.
  2. System computes a projection for the current month based on the trailing two weeks of invoice/payment data.
- **Postconditions**: None (read-only view).
