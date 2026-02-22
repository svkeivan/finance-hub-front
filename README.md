# Finance Hub

Admin dashboard for finance operations — work queues, transactions, refunds, collections, and cancellations.

## Features

- **Work Items** — Student finance states (Payment_Pending, Delinquent, Balance_Pending, Refund_Pending, Collection_Pending, etc.) with state-machine actions
- **Transactions** — Deposit, instalment, refund, collection, and fee transactions
- **Cancellations** — Agent cancellation view with refund calculator, Cost We Save logic, and cancellation reason codes (CR01–CR06)
- **Bank Match** — Bank transfer reconciliation queue
- **Arrears** — Payment_Pending and Delinquent work queues
- **Refunds** — Refund_Pending and Refund_Processing flows
- **Collections** — Collection_Pending and Collection_Processing flows
- **Credit Pipeline** — Read-only monitoring of credit states (Credit_App_Pending, Credit_Pending, Credit_Approved, Credit_Rejected)
- **Audit Log** — Action history and audit trail

## Tech Stack

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **Recharts** — Charts and dashboards
- **Motion** — Animations
- **Lucide React** — Icons

## Getting Started

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app redirects to `/admin/dashboard`.

```bash
# Other commands
npm run build   # Production build
npm run start   # Start production server
npm run lint    # Run ESLint
```

## Project Structure

```
src/
├── app/              # Next.js App Router
│   └── admin/        # Admin dashboard routes
├── components/       # UI components (Sidebar, ActionDialog, FilterSidebar, etc.)
├── lib/              # Finance context, state machine logic
├── data/             # Mock data (students, transactions)
└── types/            # TypeScript types (finance states, actions, etc.)
docs/
└── action-fields-spec.md   # Action fields, cancellation rules, refund calculator
```

## Documentation

See [`docs/action-fields-spec.md`](docs/action-fields-spec.md) for:

- Manual work items (7 queues) and their actions
- Cancellation reason codes and settlement status
- Method-dependent action rules (Bank Transfer, Premium Credit, Card/DD)
- Refund calculator logic (cool-off, digital-asset, cost-we-save)
- Automated states and business rules

## Deploy

Deploy to [Vercel](https://vercel.com/new) or any Node.js hosting. Configure environment variables as needed for production (e.g. API keys, database).
