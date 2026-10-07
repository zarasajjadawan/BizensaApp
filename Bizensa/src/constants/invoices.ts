export type InvoiceStatus = "paid" | "pending" | "overdue";

export interface Invoice {
  id: string;
  number: string; // INV-001
  customer: string;
  amount: number;
  date: string; // YYYY-MM-DD
  status: InvoiceStatus;
}

export interface InvoiceItem {
  id: string;
  name: string;
  qty: number;
  price: number; // price per unit
}

export const TAX_RATE = 0.1; // 10%

/* TODO: replace with data from your API (GET /api/invoices) */
export const INVOICES: Invoice[] = [
  { id: "1", number: "INV-001", customer: "ABC Company", amount: 55000, date: "2026-09-03", status: "paid" },
  { id: "2", number: "INV-002", customer: "XYZ Ltd", amount: 80000, date: "2026-09-02", status: "pending" },
  { id: "3", number: "INV-003", customer: "John Smith", amount: 25000, date: "2026-08-28", status: "overdue" },
];

/* TODO: replace with data from your API (GET /api/customers) */
export const CUSTOMERS = ["ABC Company", "XYZ Ltd", "John Smith"];

export const STATUS_LABEL: Record<InvoiceStatus, string> = {
  paid: "Paid",
  pending: "Pending",
  overdue: "Overdue",
};

export const STATUS_COLOR: Record<InvoiceStatus, string> = {
  paid: "#4ade80",
  pending: "#f59e0b",
  overdue: "#f87171",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-09-03" -> "3 Sep, 2026" */
export const formatShortDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}, ${y}`;
};

/** Date object -> "15 Sep, 2026" */
export const formatShortDateObj = (d: Date) =>
  `${d.getDate()} ${MONTHS[d.getMonth()]}, ${d.getFullYear()}`;
