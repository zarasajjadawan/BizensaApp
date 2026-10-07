import React from "react";

import { Group, Hint, OptionRow, ScreenShell } from "@/components/settings-parts";
import { CURRENCIES, useCurrency } from "@/constants/currency";

export default function CurrencyScreen() {
    const { code, setCurrency } = useCurrency();

    return (
        <ScreenShell title="Currency">
            <Group>
                {CURRENCIES.map((c, i) => (
                    <OptionRow
                        key={c.code}
                        label={c.label}
                        description={`Symbol: ${c.symbol}`}
                        selected={code === c.code}
                        onPress={() => setCurrency(c.code)}
                        last={i === CURRENCIES.length - 1}
                    />
                ))}
            </Group>
            <Hint>Your choice applies across the whole app and is saved on this phone.</Hint>
        </ScreenShell>
    );
}
