import React from "react";
import { Alert } from "react-native";

import { Group, Hint, ScreenShell, SwitchRow } from "@/components/settings-parts";
import { usePreference } from "@/constants/preferences";

const METHODS = [
  { key: "cash", label: "Cash", description: "Money received or paid in hand" },
  { key: "bank", label: "Bank Account", description: "Bank transfers and cheques" },
  { key: "card", label: "Credit Card", description: "Card payments" },
  { key: "wallet", label: "Mobile Wallet", description: "JazzCash, Easypaisa and similar" },
];

const DEFAULTS: Record<string, boolean> = { cash: true, bank: true, card: true, wallet: true };

export default function PaymentMethods() {
  const [enabled, setEnabled] = usePreference<Record<string, boolean>>("paymentMethods", DEFAULTS);

  const toggle = (key: string, value: boolean) => {
    const next = { ...enabled, [key]: value };
    if (!Object.values(next).some(Boolean)) {
      Alert.alert("Keep one method on", "At least one payment method must stay enabled.");
      return;
    }
    setEnabled(next);
  };

  return (
    <ScreenShell title="Payment Methods">
      <Group>
        {METHODS.map((m, i) => (
          <SwitchRow
            key={m.key}
            label={m.label}
            description={m.description}
            value={enabled[m.key] ?? true}
            onValueChange={(v) => toggle(m.key, v)}
            last={i === METHODS.length - 1}
          />
        ))}
      </Group>
      <Hint>Choose which payment methods you use. They are saved on this phone.</Hint>
    </ScreenShell>
  );
}
