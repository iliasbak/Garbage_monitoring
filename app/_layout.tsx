import { Slot } from "expo-router";
import { SessionProvider } from "@/providers/SessionProvider";
import { ConfirmationResultProvider } from "@/providers/ConfirmationResultProvider";
import { Provider } from "jotai";
import { useColorScheme } from "react-native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";

SplashScreen.preventAutoHideAsync();

export default function Root() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Provider>
        <SessionProvider>
          <ConfirmationResultProvider>
            <Slot />
          </ConfirmationResultProvider>
        </SessionProvider>
      </Provider>
    </ThemeProvider>
  );
}
