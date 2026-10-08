import { SplashScreen, Stack } from "expo-router";
import "@/global.css";
import { useFonts } from "expo-font";
import { useEffect } from "react";

import { useCurrency } from "@/constants/currency";
import { C, useAppTheme } from "@/constants/theme";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Hooks must stay above the early `return null` below
  const { code } = useCurrency();
  const { scheme, ready } = useAppTheme();

  const [fontsLoaded] = useFonts({
    "sans-bold": require("../../assets/fonts/poppins.bold.ttf"),
    "sans-extrabold": require("../../assets/fonts/poppins.extrabold.ttf"),
    "sans-medium": require("../../assets/fonts/poppins.medium.ttf"),
    "sans-regular": require("../../assets/fonts/poppins.regular.ttf"),
    "sans-semibold": require("../../assets/fonts/poppins.semibold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded && ready) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, ready]);

  // Wait for fonts AND the saved theme, so there is no dark flash for light users
  if (!fontsLoaded || !ready) {
    return null;
  }

  return (
      // `key`: when the currency or the theme changes, the whole navigation tree
      // is rebuilt, so every screen reloads with the new currency / colors.
      <Stack
          key={`${code}-${scheme}`}
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: C.bg },
          }}
      />
  );
}
