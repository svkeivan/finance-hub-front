# Finance Dashboard Implementation Checklist

## Phase 1: Product Spec Hygiene
- [x] Rewrite PRD with clear scope, goals, non-goals, workflows
- [x] Define acceptance criteria for guardrail logic
- [x] Define prototype data contract
- [x] Define operational success metrics

## Phase 2: UI Foundation
- [x] Add `/admin/finance` route
- [x] Create queue-first layout with KPI cards
- [x] Add tabbed action center (Bank Match, Finance Sync, Arrears, Refunds)
- [x] Add searchable and filterable student table
- [x] Add semantic state badges

## Phase 3: Guardrails and Actions
- [x] Implement `getAvailableActions(state)` logic
- [x] Wire `Quick Action` to first valid state action
- [x] Hide illegal actions from UI
- [x] Require reason/reference for state-changing actions

## Phase 4: Workflow Dialogs
- [x] Manual bank match dialog with mismatch warning
- [x] Finance sync dialog with mandatory external reference
- [x] Refund wizard with 3-step logic and max-refundable cap
- [x] Arrears alert cards in queue context

## Phase 5: Data and Audit Trail
- [x] Add mock student data schema in code
- [x] Track action history entries per state mutation
- [x] Capture actor metadata (`reason`, `reference`, timestamp)

## Phase 6: Motion and Polish
- [x] Add `motion` package
- [x] Animate tab content and dialog/table transitions
- [x] Improve empty states and validation messages

## Phase 7: Quality Gates
- [x] Ensure strict TypeScript compatibility
- [x] Run production build (`pnpm build`)
- [x] Verify no TypeScript build errors
