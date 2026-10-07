import React from "react";

import { Group, Hint, ScreenShell, SwitchRow } from "@/components/settings-parts";
import { usePreference } from "@/constants/preferences";

const ITEMS = [
  { key: "push", label: "Push notifications", description: "Allow alerts on this phone" },
  { key: "paymentReceived", label: "Payment received", description: "When a customer pays an invoice" },
  { key: "invoiceDue", label: "Invoice reminders", description: "Before an invoice is due" },
  { key: "overdue", label: "Overdue alerts", description: "When an invoice becomes overdue" },
  { key: "weeklyReport", label: "Weekly summary", description: "Revenue and expenses every Monday" },
];

const DEFAULTS: Record<string, boolean> = {
  push: true,
  paymentReceived: true,
  invoiceDue: true,
  overdue: true,
  weeklyReport: false,
};

export default function NotificationsScreen() {
  const [settings, setSettings] = usePreference<Record<string, boolean>>("notifications", DEFAULTS);

  return (
    <ScreenShell title="Notifications">
      <Group>
        {ITEMS.map((n, i) => (
          <SwitchRow
            key={n.key}
            label={n.label}
            description={n.description}
            value={settings[n.key] ?? DEFAULTS[n.key]}
            onValueChange={(v) => setSettings({ ...settings, [n.key]: v })}
            last={i === ITEMS.length - 1}
          />
        ))}
      </Group>
      <Hint>
        These switches are saved on this phone. Sending real notifications needs push setup
        (expo-notifications) and your backend.
      </Hint>
    </ScreenShell>
  );
}
