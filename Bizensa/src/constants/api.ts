import { useState, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import { useFocusEffect, useRouter } from "expo-router";

import { getCurrency, useCurrency } from "@/constants/currency";
import { C } from "@/constants/theme";

export const API_URL = "https://sanctuary-unlikable-uncertain.ngrok-free.dev";

export interface ApiUser {
  id: string;
  name: string;
  businessName: string;
  email: string;
  phone?: string;
  businessType?: string;
  businessAddress?: string;
  businessPhone?: string;
  taxNumber?: string;
}

/** fetch() with the saved token + JSON headers. Returns null when there is no token. */
export async function authFetch(path: string, init: RequestInit = {}) {
  const token = await SecureStore.getItemAsync("token");
  if (!token) return null;

  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "ngrok-skip-browser-warning": "true",
      ...(init.headers ?? {}),
    },
  });
}

/** Loads the logged-in user from GET /api/auth/me (reloads every time the screen is focused) */
export function useCurrentUser() {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
      useCallback(() => {
        (async () => {
          try {
            const res = await authFetch("/api/auth/me");
            if (res && res.ok) {
              const json = await res.json();
              if (json.success) setUser(json.data.user);
            }
          } catch (err) {
            console.log("Load user error:", err);
          } finally {
            setLoading(false);
          }
        })();
      }, [])
  );

  return { user, loading };
}

export interface ApiCustomer {
  _id: string;
  name: string;
  businessName?: string;
  phone?: string;
  email?: string;
  address?: string;
}

/** Loads customers from GET /api/customers (reloads every time the screen is focused) */
export function useCustomers() {
  const [customers, setCustomers] = useState<ApiCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
      useCallback(() => {
        (async () => {
          try {
            const res = await authFetch("/api/customers");
            if (res && res.ok) {
              const json = await res.json();
              if (json.success) setCustomers(json.data.customers);
            }
          } catch (err) {
            console.log("Load customers error:", err);
          } finally {
            setLoading(false);
          }
        })();
      }, [])
  );

  return { customers, loading };
}

/* =====================================================================
   GET /api/data  — one call that returns everything the screens need
   ===================================================================== */

export interface ApiExpense {
  _id: string;
  amount: number;
  category: string;
  date: string;
  paymentMethod: string;
  description: string;
  createdAt: string;
}

export interface ApiIncome {
  _id: string;
  amount: number;
  category: string;
  customer: string | null;
  date: string;
  paymentMethod: string;
  description: string;
  createdAt: string;
}

export interface ApiInvoiceItem {
  name: string;
  qty: number;
  price: number;
}

export interface ApiInvoice {
  _id: string;
  invoiceNumber: string;
  customer: string;
  items: ApiInvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  dueDate: string;
  status: string;
  createdAt: string;
  paidAt?: string | null;
}

export interface ApiSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  customerCount: number;
  invoiceCount: number;
  unpaidInvoiceCount: number;
  unpaidInvoiceTotal: number;
}

export interface AppData {
  expenses: ApiExpense[];
  income: ApiIncome[];
  customers: ApiCustomer[];
  invoices: ApiInvoice[];
  summary: ApiSummary;
}

export const EMPTY_DATA: AppData = {
  expenses: [],
  income: [],
  customers: [],
  invoices: [],
  summary: {
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    customerCount: 0,
    invoiceCount: 0,
    unpaidInvoiceCount: 0,
    unpaidInvoiceTotal: 0,
  },
};

/**
 * Loads GET /api/data. Reloads every time the screen is focused, so new
 * expenses / income / invoices show up right after you add them.
 * Redirects to sign-in when there is no token or the token is rejected.
 */
export function useAppData() {
  const router = useRouter();

  // Re-render every screen that shows money when the currency changes
  useCurrency();

  const [data, setData] = useState<AppData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await authFetch("/api/data");

      if (!res) {
        router.replace("/(auth)/sign-in");
        return;
      }
      if (res.status === 401) {
        await SecureStore.deleteItemAsync("token");
        router.replace("/(auth)/sign-in");
        return;
      }

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message ?? "Could not load data");
        return;
      }

      setData({ ...EMPTY_DATA, ...json.data });
      setError(null);
    } catch (err) {
      console.log("Load data error:", err);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
      useCallback(() => {
        refresh();
      }, [refresh])
  );

  return { data, loading, error, refresh };
}

/* =====================================================================
   Formatting + mapping helpers (used by several screens)
   ===================================================================== */

/** "Rs 1,000" or "$1,000" depending on the currency chosen in Settings > Currency */
export const formatMoney = (n: number) => {
  const { symbol, spaced } = getCurrency();
  const num = Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
  return `${symbol}${spaced ? " " : ""}${num}`;
};

/** 1000 -> "1k", 2500 -> "2.5k", 750 -> "750" (chart axis labels) */
export const formatCompact = (n: number) => {
  if (n === 0) return "0";
  if (Math.abs(n) >= 1000) return `${+(n / 1000).toFixed(1)}k`;
  return `${Math.round(n)}`;
};

/** Local calendar day key: "2026-10-06" */
export const dayKey = (iso: string) => {
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

/** Parses "2026-10-06" as a LOCAL date (no timezone shift); full ISO strings work too. */
const parseDate = (s: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(s);
};

/** "2026-10-06" or full ISO -> "6 October 2026" */
export const formatLongDate = (iso: string) =>
    parseDate(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

/** ISO -> "6 Oct 2026" */
export const formatShortDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

/** "October 2026" */
export const monthLabel = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "long", year: "numeric" });

/** % change vs a previous value. Returns null when there is nothing to compare to. */
export const pctChange = (current: number, previous: number) => {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
};

/* ---------- Transactions (income + expenses merged) ---------- */

export interface Transaction {
  id: string;
  type: "income" | "expense";
  title: string; // category
  subtitle: string; // description (falls back to payment method)
  amount: number;
  category: string;
  date: string; // ISO date
  paymentMethod: string;
  description: string;
  customer?: string | null;
}

export const buildTransactions = (data: AppData): Transaction[] => [
  ...data.income.map<Transaction>((i) => ({
    id: i._id,
    type: "income",
    title: i.category,
    subtitle: i.description || i.paymentMethod,
    amount: i.amount,
    category: i.category,
    date: i.date,
    paymentMethod: i.paymentMethod,
    description: i.description,
    customer: i.customer,
  })),
  ...data.expenses.map<Transaction>((e) => ({
    id: e._id,
    type: "expense",
    title: e.category,
    subtitle: e.description || e.paymentMethod,
    amount: e.amount,
    category: e.category,
    date: e.date,
    paymentMethod: e.paymentMethod,
    description: e.description,
  })),
];

type TxIcon =
    | "restaurant-outline"
    | "megaphone-outline"
    | "business-outline"
    | "car-outline"
    | "cart-outline"
    | "cash-outline"
    | "trending-up-outline"
    | "receipt-outline"
    | "arrow-down-outline";

const CATEGORY_ICON: Record<string, TxIcon> = {
  food: "restaurant-outline",
  marketing: "megaphone-outline",
  office: "business-outline",
  travel: "car-outline",
  sales: "cart-outline",
  investment: "trending-up-outline",
  salary: "cash-outline",
};

export const iconForTransaction = (t: Transaction): TxIcon =>
    CATEGORY_ICON[t.category.toLowerCase()] ??
    (t.type === "income" ? "arrow-down-outline" : "receipt-outline");

export const tintForTransaction = (t: Transaction) =>
    t.type === "income"
        ? { bg: C.successBg, border: C.successBorder, fg: C.successFg }
        : { bg: C.dangerBg, border: C.dangerBorder, fg: C.dangerFg };

/* ---------- Invoices ---------- */

export type InvoiceStatus = "paid" | "pending" | "overdue";

/** API only stores "paid"/"unpaid". Unpaid + past due date = overdue. */
export const invoiceStatus = (inv: ApiInvoice): InvoiceStatus => {
  if (inv.status === "paid") return "paid";
  return new Date(inv.dueDate).getTime() < Date.now() ? "overdue" : "pending";
};

export const STATUS_LABEL: Record<InvoiceStatus, string> = {
  paid: "Paid",
  pending: "Pending",
  overdue: "Overdue",
};

export const STATUS_COLOR: Record<InvoiceStatus, string> = {
  paid: "#22c55e",
  pending: "#f59e0b",
  overdue: "#ef4444",
};

/** DELETE /api/transactions/:id */
export async function deleteTransaction(id: string): Promise<void> {
  const res = await authFetch(`/api/transactions/${id}`, {
    method: "DELETE",
  });

  if (!res) {
    throw new Error("You are not logged in");
  }

  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.message || "Could not delete transaction");
  }
}