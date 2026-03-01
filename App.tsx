import React from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  useFonts,
  PlayfairDisplay_700Bold,
} from "@expo-google-fonts/playfair-display";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

import HomeScreen from "./screens/HomeScreen";
import ScanExplainScreen from "./screens/ScanExplainScreen";
import FocusModeScreen from "./screens/FocusModeScreen";
import SocraticCommuteScreen from "./screens/SocraticCommuteScreen";
import MemoryHeatmapScreen from "./screens/MemoryHeatmapScreen";
import "./global.css";

// ——— Navigation types (exported for screens) ———
export type RootStackParamList = {
  Home: undefined;
  ScanExplain: undefined;
  FocusMode: undefined;
  SocraticCommute: undefined;
  MemoryHeatmap: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// ——— Dark Theme ———
const LumenDarkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: "#D4AF37",      // Venetian Gold
    background: "#0A0A0B",   // Obsidian Night
    card: "#161618",         // Card BG
    text: "#FFFFFF",
    border: "#1E1E20",
    notification: "#6366F1", // Ethereal Violet
  },
};

// ——— Shared header style ———
const screenOptions = {
  headerShown: true,
  headerStyle: { backgroundColor: "#0A0A0B" },
  headerTintColor: "#D4AF37",
  headerTitleStyle: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
  },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: "#0A0A0B" },
  animation: "fade" as const,
};

// ——— App ———
export default function App() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0A0A0B", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={LumenDarkTheme}>
      <Stack.Navigator initialRouteName="Home" screenOptions={screenOptions}>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ScanExplain"
          component={ScanExplainScreen}
          options={{ title: "Scan & Explain" }}
        />
        <Stack.Screen
          name="FocusMode"
          component={FocusModeScreen}
          options={{ title: "Focus Mode" }}
        />
        <Stack.Screen
          name="SocraticCommute"
          component={SocraticCommuteScreen}
          options={{ title: "Socratic Commute" }}
        />
        <Stack.Screen
          name="MemoryHeatmap"
          component={MemoryHeatmapScreen}
          options={{ title: "Memory Heatmap" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
