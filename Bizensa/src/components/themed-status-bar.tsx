import React from "react";
import { StatusBar } from "react-native";

import { C, useAppTheme } from "@/constants/theme";

/** Status bar that switches icon color with the light / dark theme. */
export default function ThemedStatusBar() {
  const { isDark } = useAppTheme();

  return (
    <StatusBar
      barStyle={isDark ? "light-content" : "dark-content"}
      backgroundColor={C.bg}
    />
  );
}
