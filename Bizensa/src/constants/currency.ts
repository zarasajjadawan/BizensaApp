import { useEffect, useSyncExternalStore } from "react";
import * as SecureStore from "expo-secure-store";

/**
 * One shared currency for the whole app.
 *
 * - `useCurrency()` re-renders every component that uses it when the currency changes.
 * - `getCurrency()` can be called anywhere (even outside components, e.g. in formatMoney).
 * - The choice is saved on the phone and restored the next time the app opens.
 *
 * NOTE: this only changes the currency SYMBOL. Amounts are not converted.
 */

export type CurrencyCode = "PKR" | "USD";

export interface CurrencyInfo {
  code: CurrencyCode;
  label: string;
  symbol: string;
  spaced: boolean; // "Rs 1,000" (true) vs "$1,000" (false)
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: "PKR", label: "Pakistani Rupee (PKR)", symbol: "Rs", spaced: true },
  { code: "USD", label: "US Dollar (USD)", symbol: "$", spaced: false },
];

const STORAGE_KEY = "currency";

let current: CurrencyCode = "PKR";
let loadStarted = false;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

const isCode = (v: unknown): v is CurrencyCode =>
    CURRENCIES.some((c) => c.code === v);

const infoFor = (code: CurrencyCode): CurrencyInfo =>
    CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];

/** Current currency info (usable outside React components). */
export const getCurrency = (): CurrencyInfo => infoFor(current);

/** Loads the saved choice once per app start. */
export const loadCurrency = async () => {
  if (loadStarted) return;
  loadStarted = true;

  try {
    const saved = await SecureStore.getItemAsync(STORAGE_KEY);
    if (isCode(saved) && saved !== current) {
      current = saved;
      emit();
    }
  } catch (err) {
    console.log("Load currency error:", err);
  }
};

/** Changes the currency everywhere right away, then saves it. */
export const setCurrency = async (code: CurrencyCode) => {
  if (code === current) return;

  current = code;
  emit();

  try {
    await SecureStore.setItemAsync(STORAGE_KEY, code);
  } catch (err) {
    console.log("Save currency error:", err);
  }
};

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

/** Use this in any screen that shows money, so it updates when the currency changes. */
export function useCurrency() {
  const code = useSyncExternalStore(subscribe, () => current);

  useEffect(() => {
    loadCurrency();
  }, []);

  const info = infoFor(code);

  return {
    code,
    symbol: info.symbol,
    currency: info,
    setCurrency,
  };
}