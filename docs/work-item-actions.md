# Work Item Actions Reference

This document describes the available actions for each finance state, the resulting state transition, and the data required to confirm each action.

---

## States With No Actions

The following states have **no available actions** in the dropdown menu:

| State                | Notes                                      |
| -------------------- | ------------------------------------------ |
| Lead                 | Initial lead — no finance actions yet       |
| Pending_Details      | Awaiting student details                   |
| Quote_Sent           | Quote issued, awaiting response            |
| Application_Started  | Application in progress                    |
| Application_Review   | Under review — no manual intervention      |
| Payment_Complete     | Fully paid — terminal payment state        |
| Cancelled            | Account cancelled — no further actions     |

---

## States With Available Actions

### Active

| Action           | Next State       | Required Data                          |
| ---------------- | ---------------- | -------------------------------------- |
| Missed Payment   | Payment_Pending  | **Reason** (required)                  |
| Initiate Refund  | Refund_Pending   | **Reason** (required), Refund Wizard (3-step: Data → Analysis → Confirm) |

### Balance_Pending

| Action               | Next State        | Required Data                                                                                                  |
| -------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------- |
| Confirm Bank Deposit | Payment_Complete  | **Reason** (required), **Received Amount** (required, £). If amount ≠ total due: mismatch checkbox confirmation |
| Cancel Account       | Cancelled         | **Reason** (required). ⚠️ Destructive action warning displayed                                                 |

### Credit_Pending

| Action              | Next State        | Required Data                                                        |
| ------------------- | ----------------- | -------------------------------------------------------------------- |
| Manual Funding Sync | Payment_Complete  | **Reason** (required), **External Reference Number** (required)      |
| Credit Rejected     | Cancelled         | **Reason** (required). ⚠️ Destructive action warning displayed       |

### Payment_Pending

| Action                  | Next State          | Required Data                                                  |
| ----------------------- | ------------------- | -------------------------------------------------------------- |
| Payment Received        | Payment_Complete    | **Reason** (required)                                          |
| Escalate to Collections | Collection_Pending  | **Reason** (required). ⚠️ Destructive action warning displayed |

### Delinquent

| Action                  | Next State          | Required Data                                                  |
| ----------------------- | ------------------- | -------------------------------------------------------------- |
| Payment Received        | Payment_Complete    | **Reason** (required)                                          |
| Escalate to Collections | Collection_Pending  | **Reason** (required). ⚠️ Destructive action warning displayed |

### Refund_Pending

| Action         | Next State          | Required Data            |
| -------------- | ------------------- | ------------------------ |
| Approve Refund | Cancelled           | **Reason** (required)    |
| Reject Refund  | Refund_Pending (no change) | **Reason** (required) |

### Collection_Pending

| Action           | Next State        | Required Data         |
| ---------------- | ----------------- | --------------------- |
| Payment Received | Payment_Complete  | **Reason** (required) |

---

## Common Fields

Every action requires the following:

| Field     | Required | Description                                     |
| --------- | -------- | ----------------------------------------------- |
| Reason    | Yes      | Free-text explanation of why the action is taken |
| Reference | No       | Optional external reference number (except for **Manual Funding Sync** where it is **required**) |

---

## Destructive Actions

The following actions display a red warning banner ("This is a destructive action and cannot be easily undone"):

- **Cancel Account**
- **Escalate to Collections**
- **Credit Rejected**

---

## Refund Wizard (Initiate Refund)

The "Initiate Refund" action uses a 3-step wizard before the Confirm button becomes active:

| Step | Label    | Content                                                        |
| ---- | -------- | -------------------------------------------------------------- |
| 1    | Data     | Shows Total Paid, Enrolment Date, Modules Accessed             |
| 2    | Analysis | Displays refund scenario (Cool-off / Digital Asset Fee / Cost-We-Save) and notes |
| 3    | Confirm  | Shows Recommended Refund amount and Max Refundable amount      |

Refund scenarios:
- **Cool-off**: Within 14 days of enrolment → full refund
- **Digital Asset Fee**: 0 modules accessed → total paid minus £99 digital asset fee
- **Cost-We-Save**: Pro-rata based on modules accessed out of 12
