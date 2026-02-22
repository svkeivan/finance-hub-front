# Action Fields Specification

> Aligned with: `Manual Finance Work Items` (v1.3), `Automated Finance State Rules` (v1.1), `Finance State Machine` (v7.2), `Cancellations and Refund` (v2.0)
>
> **Last Updated:** 2026-02-18

---

## Classification


| Type             | Description                                                             | Who                  |
| ---------------- | ----------------------------------------------------------------------- | -------------------- |
| **Manual**       | Work item actions performed by CS or Finance in the admin UI            | Admin / Finance team |
| **Automated**    | System-triggered via Stripe webhooks, 3rd party API, or schedulers      | System               |
| **Cancellation** | Admin-initiated from the Cancellations page (separate from work queues) | CS / Finance team    |


---

## Cancellation Reason Codes

All cancellation-triggering actions require a **Cancellation Reason** selected from a dropdown. If "Other" (CR06) is selected, a free-text note is mandatory.


| Code | Label                             |
| ---- | --------------------------------- |
| CR01 | Student requested (cool-off)      |
| CR02 | Student requested (post cool-off) |
| CR03 | Non-payment / debt                |
| CR04 | Compassionate / medical           |
| CR05 | Course transfer / swap            |
| CR06 | Other (free text required)        |


---

## Settlement Status Values

The `settlement_status` field uses 3 values per doc section 2.5:


| Value       | Description                                    |
| ----------- | ---------------------------------------------- |
| `settled`   | Debt recovered — settlement amount is recorded |
| `unsettled` | Debt written off                               |
| `n/a`       | Not applicable                                 |


When `settled` is selected, a `settlement_amount` field is shown.

---

## Method-Dependent Action Rules

Payment confirmation actions are restricted by payment method. Automated methods (Card Instalments, DD Instalments, DD Pay Full) detect payments via Stripe webhooks or DD systems. Premium Credit receives a lump sum to AT's bank account after credit approval, requiring manual confirmation in Balance_Pending.


| Restricted Action | Available For                  | Reason                                                                           |
| ----------------- | ------------------------------ | -------------------------------------------------------------------------------- |
| Payment Received  | Bank Transfer only             | Card/DD auto-detect via Stripe/DD system                                         |
| Final Payment     | Bank Transfer only             | Card/DD auto-detect via Stripe/DD system                                         |
| Mark as Paid      | Bank Transfer + Premium Credit | Both receive funds via bank transfer (BT from student, PCL lump sum from credit) |


All other actions (Initiate Refund, Escalate to Collections, Cancel Account, Resume Payments, etc.) remain available for **all payment methods**, as they are administrative decisions independent of the payment mechanism.

> **Finance Manager (God Mode)**: Can override and perform any action regardless of payment method restrictions.

---

## 7 Manual Work Items

### 1. Payment_Pending (FIN-02) — Owner: CS


| Action                  | Target             | Required Fields                                      | Method Restriction     | Notes                          |
| ----------------------- | ------------------ | ---------------------------------------------------- | ---------------------- | ------------------------------ |
| Payment Received        | Active             | Notes                                                | **Bank Transfer only** | Auto-detected for Card/DD/PCL  |
| Final Payment           | Payment_Complete   | Notes                                                | **Bank Transfer only** | Auto-detected for Card/DD/PCL  |
| Initiate Refund         | Refund_Pending     | **Cancellation Reason** (dropdown CR01-CR06) + Notes | All methods            | Sets cancellation_source_state |
| Escalate to Collections | Collection_Pending | **Cancellation Reason** (dropdown CR01-CR06) + Notes | All methods            | Sets cancellation_source_state |
| Cancel Account          | Cancelled          | **Cancellation Reason** (dropdown CR01-CR06) + Notes | All methods            | Destructive, terminal          |


*Note: Payment_Pending → Delinquent is AUTOMATED (> X days threshold). Not shown in UI.*

### 2. Delinquent (FIN-03) — Owner: CS


| Action                  | Target             | Required Fields                                      | Notes                          |
| ----------------------- | ------------------ | ---------------------------------------------------- | ------------------------------ |
| Resume Payments         | Payment_Pending    | Notes                                                | Student resumes paying         |
| Initiate Refund         | Refund_Pending     | **Cancellation Reason** (dropdown CR01-CR06) + Notes | Sets cancellation_source_state |
| Escalate to Collections | Collection_Pending | **Cancellation Reason** (dropdown CR01-CR06) + Notes | Sets cancellation_source_state |
| Cancel Account          | Cancelled          | **Cancellation Reason** (dropdown CR01-CR06) + Notes | Destructive, terminal          |


### 3. Balance_Pending (FIN-12) — Owner: Finance


| Action          | Target           | Required Fields                                       | Method Restriction                 | Notes                                                                           |
| --------------- | ---------------- | ----------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------- |
| Mark as Paid    | Payment_Complete | **Reference Code** (auto-populated, editable) + Notes | **Bank Transfer + Premium Credit** | BT: student bank transfer. PCL: lump sum from credit company. DD auto-collects. |
| Mark as Overdue | Payment_Pending  | Notes                                                 | All methods                        |                                                                                 |


### 4. Refund_Pending (FIN-06) — Owner: Finance

> **One-way path:** Once in the refund flow, there is no reversal. The only exit is forward to Cancelled.

| Action                | Target            | Required Fields                                                      | Notes                                                                       |
| --------------------- | ----------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Proceed to Processing | Refund_Processing | **Reference Code** + **Refund Amount** (auto-calc, override) + Notes | Ref code = Stripe or manual. Amount auto-calculated from refund calculator. |


### 5. Refund_Processing (FIN-09) — Owner: Finance

| Action          | Target    | Required Fields | Notes                                                    |
| --------------- | --------- | --------------- | -------------------------------------------------------- |
| Complete Refund | Cancelled | Notes           | Ref code + amount carry forward from entry. Destructive. |


### 6. Collection_Pending (FIN-04) — Owner: Finance


| Action                | Target                      | Required Fields                                                                                           | Notes                                         |
| --------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Proceed to Processing | Collection_Processing       | **Reference Code** + Stripe Payment Link (optional URL) + Collection Amount (auto-calc, override) + Notes |                                               |
| Reverse Collection    | `cancellation_source_state` | Notes                                                                                                     | Returns to original state before cancellation |


### 7. Collection_Processing (FIN-10) — Owner: Finance


| Action                     | Target          | Required Fields                                                                        | Notes                                         |
| -------------------------- | --------------- | -------------------------------------------------------------------------------------- | --------------------------------------------- |
| Mark Settled               | Cancelled       | **Settlement Status** (settled/unsettled/n/a) + Settlement Amount (if settled) + Notes | Ref code + amount carry forward. Destructive. |
| Reverse to Payment Pending | Payment_Pending | Notes                                                                                  | Starts from scratch                           |


---

## Cancellation Page Actions

Available for: Active, Balance_Pending, Payment_Complete, Credit_Application_Pending, Credit_Pending, Credit_Approved, Credit_Rejected.

### Agent Cancellation View (Section 4)

The detailed view shows:

- **Student Context** — identity, course package, enrolment date, cool-off status, current state
- **Financial Snapshot** — package price, total received, payment method, outstanding balance
- **Module Progress** — visual progress bar, entered vs. not-entered modules, per-module Cost We Save
- **Refund Calculator Preview** — scenario (cool-off / digital asset / cost-we-save), eligible refund, refundable amount, cancellation fee status

### Actions


| Action              | Target             | Required Fields                                                                                                 | Notes                                                                    |
| ------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Initiate Refund     | Refund_Pending     | **Cancellation Reason** (dropdown CR01-CR06) + Notes + 4-step wizard (Context → Modules → Calculator → Confirm) | Sets cancellation_source_state. Fee adjustment available if fee applies. |
| Initiate Collection | Collection_Pending | **Cancellation Reason** (dropdown CR01-CR06) + Notes                                                            | Sets cancellation_source_state. Destructive.                             |
| Move to Self-Pay    | Payment_Pending    | Notes                                                                                                           | Only for Credit_Application_Pending and Credit_Pending                   |


---

## Refund Calculator (Section 3 of Cancellations doc)

The calculator is **policy-driven, deterministic, and configuration-based**.

### Inputs (per student / course package)


| Input                   | Source                                                       |
| ----------------------- | ------------------------------------------------------------ |
| Course package price    | `coursePackagePrice` on StudentRecord                        |
| Total amount received   | `totalPaid` (only direct student payments for credit states) |
| Cool-off period         | `coolOffDays` (configurable per course package)              |
| Module activity         | `modules[]` — entered flag per module                        |
| Digital Asset %         | `digitalAssetPct` (per course package)                       |
| Cost We Save per module | `modules[].costWeSave` (per course package)                  |
| Cancellation fee        | Default £250, adjustable by CS with reason                   |


### Logic Flow

1. **Cool-off Period**: Within `coolOffDays` → Eligible = 100% of package price. Refundable = min(eligible, received). No fee.
2. **No Module Activity** (outside cool-off): Eligible = `coursePackagePrice × digitalAssetPct`. If eligible ≤ received → refund. Else → fee applies.
3. **Module Activity**: Identify last module reached. Eligible = sum of Cost We Save for all unreached modules. If eligible ≤ received → refund. Else → fee applies.
4. **Cancellation Fee Exception**: Applies ONLY when `eligible > totalReceived`. Default £250, CS-adjustable with mandatory reason. No refund issued — collection required.

### Outputs


| Output                   | Type                                                        |
| ------------------------ | ----------------------------------------------------------- |
| `scenario`               | `cool-off` / `digital-asset` / `cost-we-save` / `no-refund` |
| `eligibleRefund`         | number                                                      |
| `refundableAmount`       | number (capped by total received)                           |
| `cancellationFee`        | number (0 if no fee applies)                                |
| `cancellationFeeApplies` | boolean                                                     |
| `note`                   | string (human-readable explanation)                         |


---

## Automated States (read-only monitoring)

These are displayed on the **Credit Pipeline** page as read-only. No manual actions available (unless Finance Manager override / God Mode).


| State                       | Automated Trigger       | Automated Exits                                                                           | Business Rule                         |
| --------------------------- | ----------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------- |
| Active (FIN-01)             | Deposit received        | Missed payment → Payment_Pending; Final payment → Payment_Complete                        | BRP-01: Grace period = X days         |
| Credit_App_Pending (FIN-11) | Deposit (PCL path)      | 3rd party confirms → Credit_Pending; Timeout → Payment_Pending                            | BRP-02: Submission timeout = X days   |
| Credit_Pending (FIN-13)     | 3rd party confirms sub  | API approved → Credit_Approved; API declined → Credit_Rejected; Timeout → Payment_Pending | BRP-03: API response timeout = X days |
| Credit_Approved (FIN-14)    | 3rd party approved      | Funding via Stripe → Payment_Complete; Timeout → Payment_Pending                          | BRP-04: Funding timeout = X days      |
| Credit_Rejected (FIN-08)    | 3rd party declined      | Re-approved → Credit_Approved; Resubmit → Credit_Pending; Timeout → Payment_Pending       | BRP-05: Inactivity timeout = X days   |
| Payment_Complete (FIN-05)   | Final payment confirmed | None (terminal success)                                                                   | —                                     |
| Cancelled (FIN-07)          | From processing states  | None (terminal)                                                                           | —                                     |


---

## Global Rules

1. **Cancellation Reason** — Required (dropdown CR01-CR06, with free text for "Other") when transitioning INTO Refund_Pending, Collection_Pending, or Cancelled.
2. **cancellation_source_state** — Automatically recorded when entering Refund_Pending or Collection_Pending. Used for reversals (student reverts to original state).
3. **Notes** — Required on every action for audit trail.
4. **Settlement Status** — `settled | unsettled | n/a` dropdown required when completing collections (Mark Settled). When `settled`, `settlement_amount` is also captured.
5. **Carry-forward fields** — Reference code and amounts set on entry to Refund_Processing / Collection_Processing carry forward to Cancelled state.
6. **Cancellation Fee** — Default £250. CS can adjust during Initiate Refund when fee applies. Adjustment requires mandatory reason. Fee applies ONLY when eligible refund > total received.
7. **Credit State Note** — For students in credit states, only direct student payments (e.g., deposit) count toward refund calculations. Third-party payments (e.g., Premium Credit) are excluded.

---

## Cancelled State Properties (tracked)


| Property                         | Type                      | Set By                                                |
| -------------------------------- | ------------------------- | ----------------------------------------------------- |
| `refund_issued`                  | boolean                   | Complete Refund action                                |
| `settlement_status`              | settled / unsettled / n/a | Mark Settled action                                   |
| `settlement_amount`              | number                    | Mark Settled action (when settled)                    |
| `cancellation_reason_code`       | CR01-CR06                 | Captured on entry to refund/collection/cancelled flow |
| `cancellation_reason`            | string                    | Free text (mandatory for CR06, stored for all)        |
| `cancellation_fee_adjusted`      | number                    | CS-adjusted fee (if different from default)           |
| `cancellation_fee_adjust_reason` | string                    | Mandatory when fee is adjusted                        |


