import type { Ionicons } from "@expo/vector-icons";
import {getCurrency} from "@/constants/currency";

export type TransactionType = "income" | "expense";
type IconName = React.ComponentProps<typeof Ionicons>["name"];

export interface Transaction {
  id: string;
  title: string;
  subtitle: string; // shown under the title in the list
  amount: number;
  type: TransactionType;
  category: string;
  date: string; // YYYY-MM-DD
  paymentMethod: string;
  description: string;
  receiptName?: string;
}

/* TODO: replace with data from your API (GET /api/transactions) */
export const TRANSACTIONS: Transaction[] = [
  {
    id: "1",
    title: "Client Payment",
    subtitle: "ABC Company",
    amount: 50000,
    type: "income",
    category: "Income",
    date: "2026-09-03",
    paymentMethod: "Bank Account",
    description: "Invoice #1042 payment",
  },
  {
    id: "2",
    title: "Office Rent",
    subtitle: "Office",
    amount: 30000,
    type: "expense",
    category: "Office",
    date: "2026-09-03",
    paymentMethod: "Bank Account",
    description: "September rent",
  },
  {
    id: "3",
    title: "Internet",
    subtitle: "Utilities",
    amount: 5000,
    type: "expense",
    category: "Utilities",
    date: "2026-09-03",
    paymentMethod: "Cash",
    description: "Monthly internet bill",
  },
  {
    id: "4",
    title: "Project Payment",
    subtitle: "XYZ Ltd",
    amount: 80000,
    type: "income",
    category: "Income",
    date: "2026-09-02",
    paymentMethod: "Bank Account",
    description: "Milestone 2 payment",
  },
  {
    id: "5",
    title: "Office Supplies",
    subtitle: "Office",
    amount: 5500,
    type: "expense",
    category: "Office",
    date: "2026-09-01",
    paymentMethod: "Bank Account",
    description: "Printer cartridges",
    receiptName: "receipt.jpg",
  },
];

export const getTransactionById = (id?: string) =>
  TRANSACTIONS.find((t) => t.id === id);

/* ---------- Helpers ---------- */
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const formatLongDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

export const formatMoney = (n: number) =>
  `Rs ${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

export const iconForTransaction = (t: Transaction): IconName => {
  if (t.type === "income") return "business-outline";
  if (t.category === "Utilities") return "wifi";
  if (t.category === "Office") return "home-outline";
  return "receipt-outline";
};

export const tintForTransaction = (t: Transaction) => {
  if (t.type === "income") return { bg: "#12261a", border: "#1f4d31", fg: "#4ade80" };
  if (t.category === "Utilities") return { bg: "#1c1030", border: "#4a2390", fg: "#a78bfa" };
  return { bg: "#2a1214", border: "#5c1f24", fg: "#f87171" };
};
