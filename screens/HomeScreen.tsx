// ─────────────────────────────────────────────────────────────
// screens/HomeScreen.tsx
// Premium dashboard — hub for all Lumen features
// ─────────────────────────────────────────────────────────────

import React from "react";
import {
    View,
    Text,
    ScrollView,
    Pressable,
    StyleSheet,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import FadeInView from "../components/FadeInView";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";

type HomeNav = NativeStackNavigationProp<RootStackParamList, "Home">;

interface FeatureCardProps {
    title: string;
    subtitle: string;
    icon: string;
    accentColor: string;
    onPress: () => void;
    delay: number;
}

function FeatureCard({
    title,
    subtitle,
    icon,
    accentColor,
    onPress,
    delay,
}: FeatureCardProps) {
    return (
        <FadeInView delay={delay} translateY={30}>
            <Pressable
                onPress={onPress}
                style={({ pressed }) => [
                    styles.card,
                    { borderColor: pressed ? accentColor : "rgba(255,255,255,0.06)" },
                ]}
            >
                <View style={styles.cardHeader}>
                    <Text style={styles.cardIcon}>{icon}</Text>
                    <View
                        style={[styles.accentDot, { backgroundColor: accentColor }]}
                    />
                </View>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.cardSubtitle}>{subtitle}</Text>
                <View style={[styles.cardBar, { backgroundColor: accentColor }]} />
            </Pressable>
        </FadeInView>
    );
}

export default function HomeScreen({
    navigation,
}: {
    navigation: HomeNav;
}) {
    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <StatusBar style="light" />

            {/* Header */}
            <FadeInView delay={0} translateY={-20} duration={600}>
                <View style={styles.accentLine} />
                <Text style={styles.logo}>Lumen</Text>
                <Text style={styles.tagline}>
                    Your AI-powered study companion
                </Text>
            </FadeInView>

            {/* Feature Grid */}
            <View style={styles.grid}>
                <FeatureCard
                    title="Scan & Explain"
                    subtitle="OCR your notes and get analogy-driven explanations"
                    icon="📸"
                    accentColor="#D4AF37"
                    onPress={() => navigation.navigate("ScanExplain")}
                    delay={100}
                />

                <FeatureCard
                    title="AI Focus Mode"
                    subtitle="Real-time gaze tracking keeps you accountable"
                    icon="🎯"
                    accentColor="#6366F1"
                    onPress={() => navigation.navigate("FocusMode")}
                    delay={200}
                />

                <FeatureCard
                    title="Socratic Commute"
                    subtitle="Listen to your notes and answer Socratic questions"
                    icon="🎧"
                    accentColor="#22C55E"
                    onPress={() => navigation.navigate("SocraticCommute")}
                    delay={300}
                />

                <FeatureCard
                    title="Memory Heatmap"
                    subtitle="Visualise your retention and review flashcards"
                    icon="🧠"
                    accentColor="#EAB308"
                    onPress={() => navigation.navigate("MemoryHeatmap")}
                    delay={400}
                />
            </View>

            {/* Footer */}
            <FadeInView delay={600} duration={600} style={styles.footer}>
                <View style={styles.footerBar} />
                <Text style={styles.footerText}>
                    Built with Gemini &amp; ElevenLabs
                </Text>
            </FadeInView>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0A0A0B" },
    content: { paddingHorizontal: 24, paddingTop: 72, paddingBottom: 40 },
    accentLine: { width: 48, height: 3, backgroundColor: "#6366F1", borderRadius: 2, marginBottom: 20 },
    logo: { fontFamily: "PlayfairDisplay_700Bold", color: "#D4AF37", fontSize: 42, marginBottom: 6 },
    tagline: { fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.45)", fontSize: 15, marginBottom: 40 },
    grid: { gap: 16 },
    card: { backgroundColor: "#161618", borderRadius: 20, padding: 22, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
    cardIcon: { fontSize: 28 },
    accentDot: { width: 8, height: 8, borderRadius: 4 },
    cardTitle: { fontFamily: "Inter_700Bold", color: "#FFFFFF", fontSize: 18, marginBottom: 6 },
    cardSubtitle: { fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.45)", fontSize: 13, lineHeight: 18, marginBottom: 16 },
    cardBar: { height: 3, width: 40, borderRadius: 2 },
    footer: { alignItems: "center", marginTop: 36 },
    footerBar: { width: 30, height: 2, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 1, marginBottom: 12 },
    footerText: { fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.2)", fontSize: 12 },
});
