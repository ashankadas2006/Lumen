// ─────────────────────────────────────────────────────────────
// screens/FocusModeScreen.tsx
// AI Focus Mode — uses FocusCameraView to track user gaze
// ─────────────────────────────────────────────────────────────

import React, { useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import FadeInView from "../components/FadeInView";

// Lazy-load to avoid crashing Expo Go
let FocusCameraView: React.ComponentType<any> | null = null;
try {
    FocusCameraView = require("../components/FocusCameraView").default;
} catch {
    // Not available in Expo Go
}

export default function FocusModeScreen() {
    const [isActive, setIsActive] = useState(false);
    const [isFocused, setIsFocused] = useState(true);
    const [alertCount, setAlertCount] = useState(0);
    const [sessionSeconds, setSessionSeconds] = useState(0);

    React.useEffect(() => {
        if (!isActive) return;
        const id = setInterval(() => setSessionSeconds((s) => s + 1), 1000);
        return () => clearInterval(id);
    }, [isActive]);

    const handleFocusChange = useCallback((focused: boolean) => setIsFocused(focused), []);
    const handleAlert = useCallback(() => setAlertCount((c) => c + 1), []);

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
    };

    const cameraAvailable = FocusCameraView != null;

    return (
        <View style={styles.container}>
            <FadeInView delay={0} translateY={-15} style={styles.header}>
                <Text style={styles.screenIcon}>🎯</Text>
                <Text style={styles.title}>AI Focus Mode</Text>
                <Text style={styles.subtitle}>
                    {cameraAvailable
                        ? "Tracks your gaze using the front camera. Stay focused and build better study habits."
                        : "Camera requires a development build. Run `npx expo run:android` to use this feature."}
                </Text>
            </FadeInView>

            <View style={styles.statsRow}>
                <FadeInView delay={100} fromScale={0.9} style={styles.statCard}>
                    <Text style={styles.statValue}>{formatTime(sessionSeconds)}</Text>
                    <Text style={styles.statLabel}>Session</Text>
                </FadeInView>

                <FadeInView delay={200} fromScale={0.9} style={[styles.statCard, { borderColor: isFocused ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)" }]}>
                    <View style={[styles.statusDot, { backgroundColor: isFocused ? "#22C55E" : "#EF4444" }]} />
                    <Text style={styles.statLabel}>{isFocused ? "Focused" : "Distracted"}</Text>
                </FadeInView>

                <FadeInView delay={300} fromScale={0.9} style={styles.statCard}>
                    <Text style={styles.statValue}>{alertCount}</Text>
                    <Text style={styles.statLabel}>Alerts</Text>
                </FadeInView>
            </View>

            <FadeInView delay={300} style={styles.cameraContainer}>
                {isActive && FocusCameraView ? (
                    <FocusCameraView isActive={isActive} showPreview onFocusChange={handleFocusChange} onAlert={handleAlert} trackerConfig={{ distractionLimitSeconds: 10 }} />
                ) : (
                    <View style={styles.cameraPlaceholder}>
                        <Text style={styles.placeholderIcon}>{cameraAvailable ? "📷" : "🔒"}</Text>
                        <Text style={styles.placeholderText}>{cameraAvailable ? "Camera preview will appear here" : "Requires development build\nnpx expo run:android"}</Text>
                    </View>
                )}
            </FadeInView>

            <FadeInView delay={400}>
                <Pressable
                    onPress={() => { if (!cameraAvailable) return; if (isActive) setIsActive(false); else { setIsActive(true); setSessionSeconds(0); setAlertCount(0); } }}
                    disabled={!cameraAvailable}
                    style={({ pressed }) => [styles.button, isActive ? styles.buttonStop : styles.buttonStart, pressed && styles.buttonPressed, !cameraAvailable && styles.buttonDisabled]}
                >
                    <Text style={[styles.buttonText, isActive && styles.buttonTextStop]}>
                        {!cameraAvailable ? "🔒  Requires Dev Build" : isActive ? "■  Stop Session" : "▶  Start Focus Session"}
                    </Text>
                </Pressable>
            </FadeInView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0A0A0B", paddingHorizontal: 24, paddingTop: 60 },
    header: { marginBottom: 28 },
    screenIcon: { fontSize: 36, marginBottom: 12 },
    title: { fontFamily: "PlayfairDisplay_700Bold", color: "#6366F1", fontSize: 30, marginBottom: 8 },
    subtitle: { fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.45)", fontSize: 14, lineHeight: 20 },
    statsRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
    statCard: { flex: 1, backgroundColor: "#161618", borderRadius: 16, padding: 16, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
    statValue: { fontFamily: "Inter_700Bold", color: "#FFFFFF", fontSize: 20, marginBottom: 4 },
    statLabel: { fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.4)", fontSize: 11 },
    statusDot: { width: 14, height: 14, borderRadius: 7, marginBottom: 6 },
    cameraContainer: { flex: 1, borderRadius: 20, overflow: "hidden", backgroundColor: "#161618", marginBottom: 24, minHeight: 200 },
    cameraPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
    placeholderIcon: { fontSize: 48, marginBottom: 12 },
    placeholderText: { fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.25)", fontSize: 13, textAlign: "center", lineHeight: 20 },
    button: { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginBottom: 32 },
    buttonStart: { backgroundColor: "#6366F1" },
    buttonStop: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: "#EF4444" },
    buttonPressed: { opacity: 0.85 },
    buttonDisabled: { opacity: 0.4 },
    buttonText: { fontFamily: "Inter_700Bold", color: "#FFFFFF", fontSize: 16 },
    buttonTextStop: { color: "#EF4444" },
});
