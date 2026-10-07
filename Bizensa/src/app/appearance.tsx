import React from "react";

import { Group, Hint, OptionRow, ScreenShell } from "@/components/settings-parts";
import { usePreference } from "@/constants/preferences";

const THEMES = [
  { key: "dark", label: "Dark", description: "Dark background, easy on the eyes" },
  { key: "light", label: "Light", description: "Light background" },
  { key: "system", label: "Use phone setting", description: "Match your phone's light or dark mode" },
];

export default function Appearance() {
  const [theme, setTheme] = usePreference("theme", "dark");

  return (
    <ScreenShell title="Appearance">
      <Group>
        {THEMES.map((t, i) => (
          <OptionRow
            key={t.key}
            label={t.label}
            description={t.description}
            selected={theme === t.key}
            onPress={() => setTheme(t.key)}
            last={i === THEMES.length - 1}
          />
        ))}
      </Group>
      <Hint>
        Your choice is saved on this phone. The app currently only has a dark design, so the look
        won't change until a light theme is added to constants/theme.
      </Hint>
    </ScreenShell>
  );
}
