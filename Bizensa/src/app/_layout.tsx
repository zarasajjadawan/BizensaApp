import { SplashScreen, Stack } from "expo-router";
import "@/global.css";
import { useFonts } from "expo-font";
import { useEffect } from "react";

import { useCurrency } from "@/constants/currency";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Must stay above the early `return null` below (hooks can't be called conditionally)
  const { code } = useCurrency();

  const [fontsLoaded] = useFonts({
    "sans-bold": require("../../assets/fonts/poppins.bold.ttf"),
    "sans-extrabold": require("../../assets/fonts/poppins.extrabold.ttf"),
    "sans-medium": require("../../assets/fonts/poppins.medium.ttf"),
    "sans-regular": require("../../assets/fonts/poppins.regular.ttf"),
    "sans-semibold": require("../../assets/fonts/poppins.semibold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
      // `key={code}`: when the currency changes, the whole navigation tree is
      // rebuilt, so every screen reloads and shows the new currency.
      <Stack
          key={code}
          screenOptions={{
            headerShown: false,
          }}
      />
  );
}
