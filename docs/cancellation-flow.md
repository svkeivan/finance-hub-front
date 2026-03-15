# Cancellation Request APIs

## Base URL

`&#x2F;api&#x2F;v1&#x2F;cancellation\-requests&#x2F;`

## Endpoints

### 1\. **List Cancellation Requests**

[https://miro.com/app/board/uXjVG8GtHLY=/?moveToWidget=3458764663372173726&cot=14](https://miro.com/app/board/uXjVG8GtHLY=/?moveToWidget=3458764663372173726&cot=14)

- **Permission:** Staff only
- **Returns:** Paginated list of all cancellation requests

### 2\. **Get Cancellation Request Details**

[https://miro.com/app/board/uXjVG8GtHLY=/?moveToWidget=3458764663372173727&cot=14](https://miro.com/app/board/uXjVG8GtHLY=/?moveToWidget=3458764663372173727&cot=14)

- **Permission:** Staff only
- **Returns:** Full details including calculations, notes, and related contract info

### 3\. **Calculate Preview \(Read\-only\)**

[https://miro.com/app/board/uXjVG8GtHLY=/?moveToWidget=3458764663372173728&cot=14](https://miro.com/app/board/uXjVG8GtHLY=/?moveToWidget=3458764663372173728&cot=14)

- **Purpose:** Preview refund calculation without creating request
- **Body:**

[https://miro.com/app/board/uXjVG8GtHLY=/?moveToWidget=3458764663372173732&cot=14](https://miro.com/app/board/uXjVG8GtHLY=/?moveToWidget=3458764663372173732&cot=14)

- **Returns:** Calculation details \(path, amounts, courses&#x2F;modules breakdown\)
- **Note:** Does NOT save to database

### 4\. **Submit Cancellation Request**

[https://miro.com/app/board/uXjVG8GtHLY=/?moveToWidget=3458764663372173733&cot=14](https://miro.com/app/board/uXjVG8GtHLY=/?moveToWidget=3458764663372173733&cot=14)

- **Body:**

[https://miro.com/app/board/uXjVG8GtHLY=/?moveToWidget=3458764663372173734&cot=14](https://miro.com/app/board/uXjVG8GtHLY=/?moveToWidget=3458764663372173734&cot=14)

- `adjusted\_fee`: Optional, CS can adjust collection fee
- `adjustment\_reason`: Required if `adjusted\_fee` is provided
    - **What it does:**
- Validates contract not in blocked states \(REFUND\_PENDING, COLLECTION\_PENDING, etc\.\)
- Calculates refund&#x2F;collection automatically
- Creates CancellationRequest with status SUBMITTED
- Transitions contract to either:
    - REFUND\_PENDING \(if refund scenario\)
    - COLLECTION\_PENDING \(if collection fee applies\)
        - **Returns:** Created cancellation request with full details \(201\)

### 5\. **Approve Request** \(Finance\)

[https://miro.com/app/board/uXjVG8GtHLY=/?moveToWidget=3458764663372173735&cot=14](https://miro.com/app/board/uXjVG8GtHLY=/?moveToWidget=3458764663372173735&cot=14)

- **Permission:** Finance team only
- **Precondition:** Request status must be SUBMITTED
- **Body:** Empty `\{\}`
- **What it does:**
    1. Updates request status to APPROVED
    2. Transitions contract:
    - REFUND\_PENDING → REFUND\_PROCESSING \(creates Payment with refund amount\)
    - COLLECTION\_PENDING → COLLECTION\_PROCESSING \(creates Payment with collection fee\)
    5. Records approver ID and timestamp
- **Next step:** Finance manually executes refund&#x2F;collection in payment provider \(Stripe&#x2F;PCL\), then uses manual transition API to mark contract as CANCELLED

### 6\. **Reject Request** \(Finance\)

[https://miro.com/app/board/uXjVG8GtHLY=/?moveToWidget=3458764663372173736&cot=14](https://miro.com/app/board/uXjVG8GtHLY=/?moveToWidget=3458764663372173736&cot=14)

- **Permission:** Finance team only
- **Precondition:** Request status must be SUBMITTED
- **Body:**

[https://miro.com/app/board/uXjVG8GtHLY=/?moveToWidget=3458764663372173737&cot=14](https://miro.com/app/board/uXjVG8GtHLY=/?moveToWidget=3458764663372173737&cot=14)

- **What it does:**
    1. Updates request status to REJECTED
    2. Reverts contract to `source\_finance\_state` \(original state before cancellation\)
    3. Records rejection reason and metadata

### 7\. **Cancel&#x2F;Withdraw Request** \(CS\)

[https://miro.com/app/board/uXjVG8GtHLY=/?moveToWidget=3458764663372173738&cot=14](https://miro.com/app/board/uXjVG8GtHLY=/?moveToWidget=3458764663372173738&cot=14)

- **Permission:** Customer Service
- **Precondition:** Request status must be SUBMITTED
- **Body:**

[https://miro.com/app/board/uXjVG8GtHLY=/?moveToWidget=3458764663372173741&cot=14](https://miro.com/app/board/uXjVG8GtHLY=/?moveToWidget=3458764663372173741&cot=14)

- **What it does:**
    1. Updates request status to CANCELLED
    2. Reverts contract to `source\_finance\_state`
    3. Creates note with cancellation reason

### 8\. **Add Note**

[https://miro.com/app/board/uXjVG8GtHLY=/?moveToWidget=3458764663372173742&cot=14](https://miro.com/app/board/uXjVG8GtHLY=/?moveToWidget=3458764663372173742&cot=14)

- **Body:**

[https://miro.com/app/board/uXjVG8GtHLY=/?moveToWidget=3458764663372173743&cot=14](https://miro.com/app/board/uXjVG8GtHLY=/?moveToWidget=3458764663372173743&cot=14)

- **Returns:** Created note with timestamp and creator ID \(201\)

## Key Concepts

### Request Status Flow

[https://miro.com/app/board/uXjVG8GtHLY=/?moveToWidget=3458764663372173744&cot=14](https://miro.com/app/board/uXjVG8GtHLY=/?moveToWidget=3458764663372173744&cot=14)

- **SUBMITTED:** Initial state when CS creates request
- **APPROVED:** Finance approved, moving to processing
- **REJECTED:** Finance rejected, contract reverted
- **CANCELLED:** CS withdrew before finance review, contract reverted

### Contract State Flow

### Refund Path

[https://miro.com/app/board/uXjVG8GtHLY=/?moveToWidget=3458764663372173747&cot=14](https://miro.com/app/board/uXjVG8GtHLY=/?moveToWidget=3458764663372173747&cot=14)

### Collection Path

[https://miro.com/app/board/uXjVG8GtHLY=/?moveToWidget=3458764663372173749&cot=14](https://miro.com/app/board/uXjVG8GtHLY=/?moveToWidget=3458764663372173749&cot=14)

### Calculation Paths

The system automatically determines which path applies:

[https://miro.com/app/board/uXjVG8GtHLY=/?moveToWidget=3458764663372173754&cot=14](https://miro.com/app/board/uXjVG8GtHLY=/?moveToWidget=3458764663372173754&cot=14)

### Blocked States

Cannot create cancellation request if contract is in:

- REFUND\_PENDING
- REFUND\_PROCESSING
- COLLECTION\_PENDING
- COLLECTION\_PROCESSING
- CANCELLED

### Eligible States

Can create cancellation request from:

- ACTIVE
- COMPLETE
- PAYMENT\_PENDING
- DELINQUENT
- MANDATE\_PENDING
- DIRECT\_DEBIT\_PENDING
- CREDIT\_PENDING
- CREDIT\_APPROVED
- CREDIT\_REJECTED
- PCL\_STALLED
- PCL\_COLLECTION
- LOAN\_PENDING
- LOAN\_FOLLOW\_UP

## Complete Flow Example

### Scenario 1: Refund Approval

1. **CS:** `POST &#x2F;cancellation\-requests&#x2F;` → Contract moves to REFUND\_PENDING
2. **Finance:** Reviews calculation
3. **Finance:** `POST &#x2F;cancellation\-requests&#x2F;\{id\}&#x2F;approve&#x2F;` → Contract moves to REFUND\_PROCESSING
4. **Finance:** Processes refund in Stripe&#x2F;payment provider
5. **Finance:** `POST &#x2F;contracts&#x2F;\{id\}&#x2F;manual\-transition&#x2F;` with refund reference → Contract moves to CANCELLED

### Scenario 2: Collection Approval

1. **CS:** `POST &#x2F;cancellation\-requests&#x2F;` with `adjusted\_fee` → Contract moves to COLLECTION\_PENDING
2. **Finance:** Reviews adjusted fee
3. **Finance:** `POST &#x2F;cancellation\-requests&#x2F;\{id\}&#x2F;approve&#x2F;` → Contract moves to COLLECTION\_PROCESSING
4. **Finance:** Collects fee via payment provider
5. **Finance:** `POST &#x2F;contracts&#x2F;\{id\}&#x2F;manual\-transition&#x2F;` with collection reference → Contract moves to CANCELLED

### Scenario 3: Finance Rejection

1. **CS:** `POST &#x2F;cancellation\-requests&#x2F;` → Contract moves to REFUND\_PENDING
2. **Finance:** Reviews and disagrees
3. **Finance:** `POST &#x2F;cancellation\-requests&#x2F;\{id\}&#x2F;reject&#x2F;` → Contract reverts to original state
4. **System:** Creates task for CS to communicate with student

### Scenario 4: CS Withdrawal

1. **CS:** `POST &#x2F;cancellation\-requests&#x2F;` → Contract moves to REFUND\_PENDING
2. **CS:** Student changes mind
3. **CS:** `POST &#x2F;cancellation\-requests&#x2F;\{id\}&#x2F;cancel&#x2F;` → Contract reverts to original state

