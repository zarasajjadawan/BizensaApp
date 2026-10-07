import { SplashScreen, Stack } from "expo-router";
import "@/global.css";
import { useFonts } from "expo-font";
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
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
      <Stack
          screenOptions={{
            headerShown: false,
          }}
      />
  );
}