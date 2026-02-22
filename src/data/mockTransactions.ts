import type { Transaction } from "@/types/finance";
import { MOCK_STUDENTS } from "./mockStudents";

let txnId = 1;
const nextId = () => `TXN-${String(txnId++).padStart(5, "0")}`;

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(9 + Math.floor(Math.random() * 9), Math.floor(Math.random() * 60));
  return d.toISOString();
}

function generateTransactions(): Transaction[] {
  const txns: Transaction[] = [];

  for (const s of MOCK_STUDENTS) {
    const deposit = s.depositAmount ?? 0;

    if (deposit > 0) {
      const enrollDaysAgo = Math.max(
        1,
        Math.floor(
          (Date.now() - new Date(s.enrolmentDate).getTime()) / 86400000,
        ),
      );

      txns.push({
        id: nextId(),
        at: daysAgo(enrollDaysAgo),
        studentId: s.id,
        studentName: s.name,
        type: s.method === "Premium Credit" ? "deposit" : "deposit",
        amount: deposit,
        direction: "in",
        method: s.method,
        status: "completed",
        note: `Initial deposit — ${s.coursePackage}`,
      });
    }

    if (
      s.paidInstalments != null &&
      s.paidInstalments > 0 &&
      s.instalmentAmount
    ) {
      const enrollDaysAgo = Math.max(
        1,
        Math.floor(
          (Date.now() - new Date(s.enrolmentDate).getTime()) / 86400000,
        ),
      );
      for (let i = 0; i < s.paidInstalments; i++) {
        const dayOffset = Math.max(
          1,
          enrollDaysAgo - Math.floor(((i + 1) * enrollDaysAgo) / (s.paidInstalments + 1)),
        );
        txns.push({
          id: nextId(),
          at: daysAgo(dayOffset),
          studentId: s.id,
          studentName: s.name,
          type: "instalment",
          amount: s.instalmentAmount,
          direction: "in",
          method: s.method,
          reference: `INST-${s.id}-${i + 1}`,
          status: "completed",
          note: `Instalment ${i + 1} of ${s.totalInstalments}`,
        });
      }
    }

    if (
      s.method === "Premium Credit" &&
      (s.state === "Payment_Complete" ||
        s.state === "Active" ||
        s.state === "Balance_Pending")
    ) {
      if (s.state === "Payment_Complete" && s.totalPaid > (s.depositAmount ?? 0)) {
        txns.push({
          id: nextId(),
          at: daysAgo(Math.floor(Math.random() * 30) + 5),
          studentId: s.id,
          studentName: s.name,
          type: "credit_funding",
          amount: s.totalPaid - (s.depositAmount ?? 0),
          direction: "in",
          method: s.method,
          reference: `PCL-${s.id}`,
          status: "completed",
          note: "Lump sum from Premium Credit",
        });
      }
    }

    if (
      s.method === "Bank Transfer" &&
      s.state === "Payment_Complete" &&
      s.totalPaid > (s.depositAmount ?? 0) &&
      !s.paidInstalments
    ) {
      txns.push({
        id: nextId(),
        at: daysAgo(Math.floor(Math.random() * 20) + 3),
        studentId: s.id,
        studentName: s.name,
        type: "full_payment",
        amount: s.totalPaid - (s.depositAmount ?? 0),
        direction: "in",
        method: s.method,
        reference: s.referenceCode ?? `BT-${s.id}`,
        status: "completed",
        note: "Balance payment received via bank transfer",
      });
    }

    if (s.state === "Refund_Processing" && s.refundAmount) {
      txns.push({
        id: nextId(),
        at: daysAgo(Math.floor(Math.random() * 10) + 1),
        studentId: s.id,
        studentName: s.name,
        type: "refund",
        amount: s.refundAmount,
        direction: "out",
        method: s.method,
        reference: s.referenceCode,
        status: "pending",
        note: "Refund in processing",
      });
    }

    if (s.state === "Cancelled" && s.refundAmount) {
      txns.push({
        id: nextId(),
        at: daysAgo(Math.floor(Math.random() * 15) + 1),
        studentId: s.id,
        studentName: s.name,
        type: "refund",
        amount: s.refundAmount,
        direction: "out",
        method: s.method,
        reference: s.referenceCode,
        status: "completed",
        note: "Refund issued",
      });
    }

    if (
      (s.state === "Collection_Processing" || s.state === "Cancelled") &&
      s.collectionAmount
    ) {
      txns.push({
        id: nextId(),
        at: daysAgo(Math.floor(Math.random() * 10) + 1),
        studentId: s.id,
        studentName: s.name,
        type: "collection_recovery",
        amount: s.collectionAmount,
        direction: "in",
        method: s.method,
        reference: s.referenceCode,
        status: s.state === "Cancelled" ? "completed" : "pending",
        note: "Debt recovery via collections",
      });
    }

    if (s.state === "Payment_Pending" && s.paidInstalments != null && s.instalmentAmount) {
      txns.push({
        id: nextId(),
        at: daysAgo(Math.floor(Math.random() * 5) + 1),
        studentId: s.id,
        studentName: s.name,
        type: "instalment",
        amount: s.instalmentAmount,
        direction: "in",
        method: s.method,
        reference: `INST-${s.id}-${s.paidInstalments + 1}`,
        status: "failed",
        note: `Instalment ${(s.paidInstalments ?? 0) + 1} — payment missed`,
      });
    }
  }

  txns.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return txns;
}

export const MOCK_TRANSACTIONS: Transaction[] = generateTransactions();
