# PRD: Finance Admin & Action Center

## 1) Product Intent
Build a high-trust finance operations dashboard for staff handling student payment lifecycles.  
The UI should reduce operator error, surface highest-priority work first, and enforce state-transition guardrails.

## 2) Goals and Non-Goals
### Goals
- Provide one operational hub for all finance exceptions.
- Prevent illegal state transitions using action-level guardrails.
- Speed up manual finance operations (bank matching, credit sync, refunds).
- Create a reliable audit trail for every financial state change.

### Non-Goals (Phase 1)
- Full backend workflow orchestration.
- Real-time external provider integration (Stripe/Premium Credit webhooks).
- Final legal policy engine implementation beyond UI decision support.

## 3) Scope
### In Scope
- `/admin/finance` dashboard.
- Queue-based action center.
- Student directory with search and filters.
- Student detail actions constrained by current finance state.
- Manual match workflow for bank transfers.
- Manual finance sync workflow for Premium Credit.
- Refund calculator wizard with rule-based recommendation.
- UX-level audit capture (reason/reference required).

### Out of Scope
- Multi-tenant permissions model.
- Case assignment automation.
- External communication tooling (email/SMS).

## 4) System Model
The dashboard controls a 14-state finance machine across payment methods:
- Stripe Full
- Stripe Instalments
- Premium Credit
- Bank Transfer

The UI must expose only valid actions for the current state. Illegal transitions are not visible or actionable.

## 5) Information Architecture
### Global Action Center (primary)
The default screen is queue-first to avoid "hunt and peck" workflows.

| Queue | Target States | Primary Component | Operator Purpose |
| :--- | :--- | :--- | :--- |
| Bank Match | `Balance_Pending` | Table | Reconcile manual bank transfers |
| Finance Sync | `Credit_Pending` | Table | Resolve Premium Credit API lag |
| Arrears | `Payment_Pending`, `Delinquent` | Alert cards + table | Recover missed payments |
| Refunds | `Refund_Pending` | Table | Process approved refunds |

### Student Directory (secondary)
- Search by student name, email, or student ID.
- Filters for payment method, state, and course package.
- Status badges with semantic severity.

## 6) Core UX Requirements
### 6.1 Queue Dashboard
- Top KPI cards:
  - Total Arrears
  - Pending Bank Matches
  - Stale Finance Apps
  - Refunds Owed
- Queue tabs with record counts.
- Default sorting by `lastUpdated` descending.

### 6.2 Student Row Actions
- `View Profile` opens detail context.
- `Quick Action` triggers highest-priority guardrail-safe action.
- Every write action requires an operator reason and/or external reference.

### 6.3 State Badge Mapping
- Success: `Active`, `Payment_Complete`
- Warning: `Payment_Pending`, `Credit_Pending`
- Destructive: `Delinquent`, `Collection_Pending`
- Secondary: `Refund_Pending`, `Balance_Pending`

## 7) Guardrail Logic
Button visibility and action availability must be state-driven.

```ts
const getAvailableActions = (state: string): string[] => {
  switch (state) {
    case "Active":
      return ["Missed Payment", "Initiate Refund"];
    case "Balance_Pending":
      return ["Confirm Bank Deposit", "Cancel Account"];
    case "Credit_Pending":
      return ["Manual Funding Sync", "Credit Rejected"];
    case "Delinquent":
      return ["Payment Received", "Escalate to Collections"];
    default:
      return [];
  }
};
```

Acceptance rule: unavailable transitions are never displayed, not just disabled.

## 8) Key Workflows
### 8.1 ManualMatchDialog
- Display expected amount (e.g. `Expected: £250.00`).
- Input for received amount.
- If received != expected, show warning:
  - "This will leave an outstanding balance. Proceed?"
- Require reason before confirming.

### 8.2 FinanceSyncButton / Dialog
- Premium Credit only.
- Mandatory external reference input.
- On confirm, transition record to `Payment_Complete` with audit payload.

### 8.3 Refund Calculator Wizard
Multi-step dialog:
1. Data step: read `totalPaid`, `enrolmentDate`, `modulesAccessed`.
2. Logic step:
   - `< 14 days` -> Cool-off (`100% refund`)
   - `modulesAccessed == 0` -> Digital asset fee logic
   - Else -> Cost-we-save logic
3. Validation step:
   - Show recommended refund
   - Show max refundable (cap by total paid)
   - Require operator confirmation reason

## 9) Data Contract (Prototype)
```json
[
  {
    "id": "STU001",
    "name": "James Watt",
    "email": "james.watt@example.com",
    "method": "Bank Transfer",
    "state": "Balance_Pending",
    "access": "Full",
    "totalPaid": 250,
    "totalDue": 1500,
    "modulesAccessed": 2,
    "enrolmentDate": "2026-01-20",
    "lastUpdated": "2026-02-01T10:00:00Z"
  }
]
```

## 10) Success Metrics
- Zero illegal state changes from UI.
- Manual activation (credit sync path) in <= 60 seconds.
- 100% of state changes carry reason or reference metadata.
- Reduced time-to-first-action for queue items.

## 11) Accessibility and Trust Requirements
- Keyboard-navigable dialogs and tabs.
- Clear destructive action labeling.
- Inline validation for required reason/reference fields.
- Human-readable action history for each student.

## 12) Implementation Notes
- Frontend stack: Next.js + TypeScript + Tailwind.
- UI primitives can follow shadcn patterns.
- Use motion animations for dialog/table transitions.