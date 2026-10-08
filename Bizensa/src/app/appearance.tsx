import React from "react";

import { Group, Hint, OptionRow, ScreenShell } from "@/components/settings-parts";
import { ThemeMode, useAppTheme } from "@/constants/theme";

const THEMES: { key: ThemeMode; label: string; description: string }[] = [
    { key: "dark", label: "Dark", description: "Dark background, easy on the eyes" },
    { key: "light", label: "Light", description: "Light background" },
    { key: "system", label: "Use phone setting", description: "Match your phone's light or dark mode" },
];

export default function Appearance() {
    const { mode, setThemeMode } = useAppTheme();

    return (
        <ScreenShell title="Appearance">
            <Group>
                {THEMES.map((t, i) => (
                    <OptionRow
                        key={t.key}
                        label={t.label}
                        description={t.description}
                        selected={mode === t.key}
                        onPress={() => setThemeMode(t.key)}
                        last={i === THEMES.length - 1}
                    />
                ))}
            </Group>
            <Hint>Your choice applies to the whole app and is saved on this phone.</Hint>
        </ScreenShell>
    );
}
