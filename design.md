# InvoicePro — Design Document (POC)

Companion to [spec.md](spec.md) and [usecases.md](usecases.md). Describes the technical design for the proof-of-concept.

## 1. Architecture Overview

Single Next.js application (frontend + backend in one deployable unit) to minimize moving parts for a POC.

```
┌─────────────────────────────────────────────┐
│                Next.js App                   │
│                                               │
│  Pages (React)          API Routes           │
│  ┌────────────────┐    ┌──────────────────┐  │
│  │ Dashboard       │    │ /api/dashboard   │  │
│  │ Invoice List    │───▶│ /api/invoices    │  │
│  │ Invoice Detail  │    │ /api/invoices/:id│  │
│  │ Import          │    │ /api/import      │  │
│  │ Follow-up UI    │    │ /api/followup    │  │
│  └────────────────┘    └────────┬─────────┘  │
│                                  │            │
│                          Prisma ORM           │
│                                  │            │
│                            SQLite DB          │
└─────────────────────────────────────┼─────────┘
                                      │
                            (optional) Claude API
                            for follow-up message text
```

- **Frontend**: React (via Next.js), Tailwind CSS for styling.
- **Backend**: Next.js API routes (Node.js runtime).
- **ORM / DB**: Prisma + SQLite (file-based, no separate DB server needed for POC).
- **CSV parsing**: `papaparse` (client-side pre-validation) or `csv-parse` (server-side parsing on upload).
- **LLM**: Claude API, called only from server-side API routes (never from the browser), with a template-based fallback.

## 2. Data Model

### Customer
| Field | Type | Notes |
|---|---|---|
| id | string (PK) | |
| name | string | |

### Invoice
| Field | Type | Notes |
|---|---|---|
| id | string (PK) | |
| invoiceNumber | string | e.g. `INV-1042` |
| customerId | string (FK → Customer) | |
| amount | decimal | |
| invoiceDate | date | |
| dueDate | date | |
| status | enum: `unpaid`, `paid` | |
| paidDate | date, nullable | set when marked paid |
| paidLate | boolean, computed/stored | `paidDate > dueDate` |
| lastFollowUpDate | date, nullable | |

### FollowUpLog
A lightweight log (not a full audit trail — see spec.md §10) so the Invoice Detail screen can show follow-up history.

| Field | Type | Notes |
|---|---|---|
| id | string (PK) | |
| invoiceId | string (FK → Invoice) | |
| createdAt | datetime | |
| tone | enum: `polite`, `firm`, `escalation` | |

No separate `ImportBatch` table is persisted; the import summary (rows imported/rejected) is computed and returned in the API response at upload time, not stored.

## 3. Derived / Computed Values (not stored, computed on read)

- **daysOverdue** = `today - dueDate` (invoice unpaid, dueDate in the past; else 0).
- **customerDefaultCount** = count of that customer's invoices where `status = paid AND paidLate = true`, OR `status = unpaid AND dueDate < today` (currently overdue counts toward risk too, per spec.md §5's "paid late or not paid").
- **riskLevel** = `High` if `customerDefaultCount > 2`, else `Low`.
- **recommendedAction** = derived from `riskLevel` (`Low` → standard reminder copy, `High` → firm/escalation copy).
- **cashFlowForecast** (current month) = `(sum of amounts collected in the last 14 days / 14) × days remaining in current month`, added to amount already collected this month. Simple linear projection, intentionally not a statistical model — matches the POC scope in spec.md §6.

## 4. API Design

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/import` | Upload + parse CSV, validate rows, upsert Customers/Invoices, return `{importedCount, errors: [{row, message}]}` |
| GET | `/api/invoices` | List invoices; query params for search/filter (`customer`, `status`, `minAge`, `maxAge`, `minAmount`, `maxAmount`, `risk`) |
| GET | `/api/invoices/:id` | Invoice detail incl. computed risk/overdue fields and follow-up log |
| PATCH | `/api/invoices/:id` | Update status (`followedUp` sets `lastFollowUpDate`; `paid` sets `status`, `paidDate`) |
| GET | `/api/dashboard` | Aggregate figures: total outstanding, overdue amount, due in 7 days, expected collections this week, high-risk customers, cash-flow forecast |
| POST | `/api/followup` | Body: `{invoiceId}` → returns `{polite, firm, escalation}` message drafts (LLM or template fallback); also writes a `FollowUpLog` row |

## 5. Follow-up Message Generation

1. Server loads invoice + customer + risk level.
2. If `ANTHROPIC_API_KEY` is configured, call Claude API with a prompt containing invoice facts (customer, amount, days overdue, risk) and ask for three tone variants.
3. If the API call fails or is not configured, fall back to static templates with the invoice facts interpolated in, e.g.:
   - *Polite*: "Hi {customer}, just a friendly reminder that invoice {invoiceNumber} for {amount} was due on {dueDate}. Let us know if you have any questions."
   - *Firm*: "Hi {customer}, invoice {invoiceNumber} for {amount} is now {daysOverdue} days overdue. Please arrange payment at your earliest convenience."
   - *Escalation*: "This is to formally notify you that invoice {invoiceNumber} ({amount}) is significantly overdue ({daysOverdue} days) and has been escalated to the account owner."
4. Response returned to client; client offers "copy to clipboard" per version.

## 6. Frontend Pages (Next.js routes)

| Route | Screen |
|---|---|
| `/dashboard` | Dashboard (default landing page) |
| `/invoices` | Invoice List |
| `/invoices/[id]` | Invoice Detail (includes Follow-up Assistant panel) |
| `/import` | Import Page |

The Follow-up Assistant (spec.md §4.5) is implemented as a panel/modal within Invoice Detail rather than a standalone route, since it always operates in the context of one invoice.

## 7. CSV Import Validation Rules

Required columns: `invoice_number, customer_name, amount, invoice_date, due_date, status`.

A row is rejected (with a reported reason) if:
- Any required column is missing or blank.
- `amount` is not a positive number.
- `invoice_date` or `due_date` is not a parseable date, or `due_date < invoice_date`.
- `status` is not one of `unpaid`/`paid`.

Valid rows are upserted: match existing `Customer` by name (case-insensitive), create if not found; match existing `Invoice` by `invoice_number` for re-imports (update rather than duplicate).

## 8. Out of Scope for POC Design

- Authentication/authorization (single implicit user; no login flow specified yet — see spec.md §11).
- Automated email sending (message is copied manually, per spec.md §10).
- Historical/audit logging of status changes beyond the lightweight `FollowUpLog` (spec.md §10).
- Any external integrations (spec.md §10).
