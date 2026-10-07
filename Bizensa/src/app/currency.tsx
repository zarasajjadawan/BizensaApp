import React from "react";

import { Group, Hint, OptionRow, ScreenShell } from "@/components/settings-parts";
import { usePreference } from "@/constants/preferences";

const CURRENCIES = [
  { code: "PKR", label: "Pakistani Rupee (PKR)", description: "Rs" },
  { code: "USD", label: "US Dollar (USD)", description: "$" },
];

export default function CurrencyScreen() {
  const [currency, setCurrency] = usePreference("currency", "PKR");

  return (
    <ScreenShell title="Currency">
      <Group>
        {CURRENCIES.map((c, i) => (
          <OptionRow
            key={c.code}
            label={c.label}
            description={`Symbol: ${c.description}`}
            selected={currency === c.code}
            onPress={() => setCurrency(c.code)}
            last={i === CURRENCIES.length - 1}
          />
        ))}
      </Group>
      <Hint>Your choice is saved on this phone.</Hint>
    </ScreenShell>
  );
}
