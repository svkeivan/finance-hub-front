# Delinquent Cancellation Flow — Implementation Audit

## Overview

This document traces how the cancellation flow works **in the actual codebase** for students in the `Delinquent` state, compares it against the [Cancellation Request APIs](./cancellation-flow.md) spec, and flags inconsistencies.

---

## 1. Where Delinquent Students Appear

Delinquent students surface in the **Arrears** queue (`/admin/arrears`), alongside `Payment_Pending` students. Delinquent rows sort to the top and carry an "Urgent" badge.

They do **not** appear on the Cancellations page (`/admin/cancellations`). That page is gated by `CANCELLATION_ELIGIBLE`, which only includes:

```
Active, Balance_Pending, Payment_Complete, Credit_Pending, Credit_Approved, Credit_Rejected
```

Delinquent is intentionally excluded from that list — the code routes delinquent cancellation through the Arrears page instead.

---

## 2. Available Action: "Assess & Resolve"

The only manual action available for a Delinquent student is **"Assess & Resolve"** (defined in `ACTION_MAP` in `src/lib/finance.ts`).

This action:

- Is classified as **destructive** (appears in `DESTRUCTIVE_ACTIONS`)
- **Requires a cancellation reason** (appears in `NEEDS_CANCELLATION_REASON`)
- Opens a 4-step wizard in the ActionDialog

---

## 3. Step-by-Step Flow

### Step 1 — CS opens Assess & Resolve from Arrears page

The ActionDialog renders a 4-step wizard because `isAssessResolve = true` triggers `isRefundInit = true`, which activates the refund calculator wizard.

**Wizard Steps:**

| Step | Label | Content |
|------|-------|---------|
| 1 | Decision | System decision badge (Refund or Collection path), calculator result (scenario, eligible, refundable, fee), student context (name, course, price, outstanding, enrolment, cool-off) |
| 2 | Modules | Module progress list with entered/not-entered status and per-module Cost We Save values |
| 3 | Adjust | CS can adjust cancellation fee (if collection path) with mandatory reason. For refund path, shows the recommended amount (no adjustment — Finance adjusts later). |
| 4 | Submit | Submission summary showing system-determined path, amounts, and single "Submit to Finance" button |

### Step 2 — CS selects cancellation reason

A dropdown with codes CR01–CR06 is required (because "Assess & Resolve" is in `NEEDS_CANCELLATION_REASON`). If CR06 ("Other") is selected, free text is mandatory.

For Delinquent students, the typical reason is **CR03 — Non-payment / debt**.

### Step 3 — CS writes notes

A free-text notes field is always required.

### Step 4 — System decides path, CS submits

At Step 4, the system has already determined the path based on the calculator result. A single "Submit to Finance" button is shown. No dual-path selection.

The mapping happens in `handleSubmit` automatically:

```
refundCalc.cancellationFeeApplies === true  → effectiveAction = "Escalate to Collections"
refundCalc.cancellationFeeApplies === false → effectiveAction = "Initiate Refund"
```

### Step 5 — State transition executes

In `finance-context.tsx`, `applyAction` runs:

1. `getNextStateForAction(effectiveAction, currentState)` determines the new state
2. The student record is updated:
   - `state` → `Refund_Pending` or `Collection_Pending`
   - `access` → updated from STATE_ACCESS_LEVEL (`Partial_Back` for Refund_Pending, `Blocked` for Collection_Pending)
   - `cancellationSourceState` → saved as `"Delinquent"` (the state before transition)
   - `cancellationReasonCode` → from dropdown (e.g. `"CR03"`)
   - `cancellationReason` → from free text or mapped label
   - `cancellationFeeAdjusted` / `cancellationFeeAdjustReason` → if CS overrode the fee
3. An audit log entry is created

---

## 4. Downstream Flow After Assessment

### Path A: Refund (Delinquent → Refund_Pending → Refund_Processing → Cancelled)

| Stage | Page | Action | Next State |
|-------|------|--------|------------|
| Refund_Pending | `/admin/refunds` | "Proceed to Processing" | Refund_Processing |
| Refund_Processing | `/admin/refunds` | "Complete Refund" | Cancelled |

**Proceed to Processing** (Finance review) requires:
- Approved refund amount (pre-filled from CS calculator recommendation, Finance can adjust)
- Notes

**Complete Refund** (after executing in payment provider) requires:
- Reference code (e.g. `STR-REF-XXXX` — entered after executing in Stripe/bank)
- Notes

### Path B: Collection (Delinquent → Collection_Pending → Collection_Processing → Cancelled)

| Stage | Page | Action | Next State |
|-------|------|--------|------------|
| Collection_Pending | `/admin/collections` | "Proceed to Processing" | Collection_Processing |
| Collection_Processing | `/admin/collections` | "Mark Settled" | Cancelled |

**Proceed to Processing** requires:
- Reference code (e.g. `COL-REF-XXXX`)
- Optional Stripe payment link
- Collection amount (auto-calculated as outstanding debt, overridable)

**Mark Settled** requires:
- Settlement status: `settled` / `unsettled` / `n/a`
- Settlement amount (if settled)
- Notes

---

## 5. Refund Calculator Behaviour for Delinquent Students

The `calculateRefundRecommendation` function runs against Delinquent students. Key observations:

- **Cool-off is almost always expired** — Delinquent students have been overdue for extended periods, so `daysSince(enrolmentDate) > coolOffDays` is virtually guaranteed.
- **Most Delinquent students have module activity** — they enrolled and started studying before going delinquent, so the **Cost We Save** scenario applies.
- **Total received is typically low** — Delinquent students have missed payments, so `totalPaid` is often much less than the `coursePackagePrice`.
- **Cancellation fee often applies** — because eligible refund (sum of undelivered module CWS) frequently exceeds `totalPaid`, triggering the collection fee scenario.

Practical result: Most Delinquent students will show a **cancellation fee** scenario (collection path), not a refund scenario.

---

## 6. Data Tracking Through the Pipeline

The following fields carry through the entire journey via object spread (`...row`):

| Field | Set When | Purpose |
|-------|----------|---------|
| `cancellationSourceState` | On Assess & Resolve | Tracks original state (`"Delinquent"`) |
| `cancellationReasonCode` | On Assess & Resolve | CR01–CR06 |
| `cancellationReason` | On Assess & Resolve | Free text or mapped label |
| `cancellationFeeDefault` | Pre-set on student record (or default £250) | Base fee amount |
| `cancellationFeeAdjusted` | On Assess & Resolve (optional) | CS override |
| `cancellationFeeAdjustReason` | On Assess & Resolve (required if adjusted) | Reason for override |
| `referenceCode` | On Complete Refund / Proceed to Processing (collection) | Payment provider ref entered after executing in Stripe/bank |
| `refundAmount` | On Proceed to Processing (refund path) | Confirmed refund amount |
| `collectionAmount` | On Proceed to Processing (collection path) | Confirmed collection amount |
| `settlementAmount` | On Mark Settled (collection path) | Actual amount recovered |
| `stripePaymentLink` | On Proceed to Processing (collection path, optional) | Stripe link for student to pay |

---

## 7. Comparison with API Document (cancellation-flow.md)

### What matches

| Document Spec | Code Implementation | Status |
|---------------|-------------------|--------|
| Delinquent is an eligible state for cancellation | Delinquent can enter Refund_Pending or Collection_Pending via "Assess & Resolve" | Matches (different UI path, same result) |
| Cancellation request transitions to REFUND_PENDING or COLLECTION_PENDING | System auto-determines path from calculator: `cancellationFeeApplies` → Collection_Pending, otherwise → Refund_Pending | Matches |
| Cancellation fee can be adjusted by CS with reason | Fee override + reason fields in wizard Step 3 (Adjust) | Matches |
| Refund/collection calculation is automatic and shown upfront | `calculateRefundRecommendation` runs at Step 1 (Decision) before CS takes any action | Matches |
| Finance adjusts refund amount, not CS | Proceed to Processing shows CS recommendation, Finance can override the amount | Matches |
| Reference code entered after payment provider execution | Complete Refund requires reference code (entered after Stripe/bank processing) | Matches |
| `source_finance_state` is tracked | `cancellationSourceState` saved on the student record | Matches |

### What does not match

| # | Document Spec | Code Implementation | Impact |
|---|---------------|-------------------|--------|
| 1 | **Request status flow**: SUBMITTED → APPROVED / REJECTED / CANCELLED | No request status tracking. State transitions happen immediately — there is no "submitted" intermediate holding state. | The approval gate described in the doc does not exist. CS action directly changes the student's finance state. |
| 2 | **Finance approval required**: Approve endpoint transitions REFUND_PENDING → REFUND_PROCESSING | In code, CS (or any user) can click "Proceed to Processing" directly on the Refunds page. No role-based permission check. | Anyone can move students through the pipeline — no Finance-only gate. |
| 3 | **Reject flow**: Finance rejects → contract reverts to `source_finance_state` | No reject action exists anywhere in the code. Once in Refund_Pending or Collection_Pending, the only path is forward. | If a cancellation request needs to be rejected, there is no mechanism to revert the student. |
| 4 | **Cancel/Withdraw flow**: CS withdraws → contract reverts to `source_finance_state` | No withdraw action exists. Once CS submits, they cannot undo it. | CS cannot take back a cancellation request after submission. |
| 5 | **Delinquent on Cancellations page**: Doc lists Delinquent as eligible for cancellation requests | Delinquent is NOT in `CANCELLATION_ELIGIBLE`. Flow is accessed through Arrears page → "Assess & Resolve" instead. | Functional parity (same transitions occur), but the UI path is different from what the doc implies. |
| 6 | **Payment_Pending cancellation**: Doc lists Payment_Pending as eligible for refund/collection path | Payment_Pending has "Cancel Account" (→ Cancelled directly) but is NOT in `CANCELLATION_ELIGIBLE`. It doesn't go through the refund/collection pipeline. | Payment_Pending students skip the refund calculator and go directly to Cancelled. |
| 7 | **Resume Payments from Delinquent**: `new-state.md` says Delinquent can exit to Payment_Pending | No "Resume Payments" action in Delinquent's ACTION_MAP. Only "Assess & Resolve" is available. | A student who starts paying again from Delinquent has no way to return to Payment_Pending. |
| 8 | **Direct cancellation from Delinquent**: `new-state.md` says Delinquent → Cancelled (direct, if no refund/collection needed) | No direct "Cancel Account" action for Delinquent. Must go through refund or collection path. | Cannot directly close a Delinquent student with zero balance scenarios. |
| 9 | **Missing states from doc**: Mandate_Pending, Direct_Debit_Pending, PCL_Stalled, PCL_Collection, Loan_Pending, Loan_Follow_Up | These FinanceState values do not exist in the type definitions | Likely future states or naming differences — not implemented yet. |
| 10 | **Calculate Preview (read-only)**: Doc describes a preview endpoint that doesn't save | The refund calculator runs in-browser via `calculateRefundRecommendation` — it's always read-only (no backend). | Functionally equivalent since there's no backend. |
| 11 | **Add Note endpoint**: Doc describes adding notes to cancellation requests | Notes are written as the "reason" field during actions but there's no dedicated note-adding feature on existing requests. | No way to add follow-up notes to an in-progress cancellation. |

---

## 8. Mock Data Coverage

Students that demonstrate the Delinquent cancellation path:

| ID | State | Source | Path | Notes |
|----|-------|--------|------|-------|
| STU011–015 | Delinquent | — | Entry point | 5 students, one per payment method |
| STU058 | Refund_Pending | Delinquent | Refund | After Assess & Resolve → Send to Refund |
| STU032–034 | Collection_Pending | Delinquent | Collection | After Assess & Resolve → Send to Collections |
| STU037 | Collection_Processing | Delinquent | Collection | After Proceed to Processing (collection path) |
| STU059 | Cancelled | Delinquent | Refund complete | Full journey: Delinquent → Refund_Pending → Refund_Processing → Cancelled |
| STU060 | Cancelled | Delinquent | Collection settled | Full journey: Delinquent → Collection_Pending → Collection_Processing → Cancelled |
