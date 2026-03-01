// ─────────────────────────────────────────────────────────────
// screens/MemoryHeatmapScreen.tsx
// Memory Heatmap + Flashcard review screen
// ─────────────────────────────────────────────────────────────

import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from "react-native";
import FadeInView from "../components/FadeInView";
import FlashcardList, { type Flashcard } from "../components/FlashcardList";
import HeatmapOverlay, { type BoundingBox } from "../components/HeatmapOverlay";

const DEMO_FLASHCARDS: Flashcard[] = [
    { id: "1", front: "Newton's Third Law", back: "For every action, there is an equal and opposite reaction.", mastery: 0.85 },
    { id: "2", front: "Entropy (2nd Law)", back: "In an isolated system, entropy always increases over time.", mastery: 0.55 },
    { id: "3", front: "Heisenberg Uncertainty", back: "Cannot simultaneously know exact position and momentum of a particle.", mastery: 0.25 },
    { id: "4", front: "Ohm's Law", back: "V = IR — Voltage equals current times resistance.", mastery: 0.92 },
    { id: "5", front: "Photosynthesis", back: "6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂", mastery: 0.38 },
];

const DEMO_BOXES: BoundingBox[] = [
    { id: "b1", x: 20, y: 30, width: 260, height: 36, level: "success", label: "Newton's Third Law" },
    { id: "b2", x: 20, y: 80, width: 240, height: 36, level: "warning", label: "Entropy" },
    { id: "b3", x: 20, y: 130, width: 280, height: 36, level: "critical", label: "Uncertainty Principle" },
    { id: "b4", x: 20, y: 180, width: 200, height: 36, level: "success", label: "Ohm's Law" },
    { id: "b5", x: 20, y: 230, width: 250, height: 36, level: "critical", label: "Photosynthesis" },
];

type Tab = "heatmap" | "flashcards";

export default function MemoryHeatmapScreen() {
    const [activeTab, setActiveTab] = useState<Tab>("flashcards");

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <FadeInView delay={0} translateY={-15}>
                <Text style={styles.screenIcon}>🧠</Text>
                <Text style={styles.title}>Memory Heatmap</Text>
                <Text style={styles.subtitle}>Visualise your retention with colour-coded overlays and review flashcards.</Text>
            </FadeInView>

            <FadeInView delay={100} translateY={15} style={styles.tabRow}>
                <Pressable onPress={() => setActiveTab("flashcards")} style={[styles.tab, activeTab === "flashcards" && styles.tabActive]}>
                    <Text style={[styles.tabText, activeTab === "flashcards" && styles.tabTextActive]}>Flashcards</Text>
                </Pressable>
                <Pressable onPress={() => setActiveTab("heatmap")} style={[styles.tab, activeTab === "heatmap" && styles.tabActive]}>
                    <Text style={[styles.tabText, activeTab === "heatmap" && styles.tabTextActive]}>Heatmap</Text>
                </Pressable>
            </FadeInView>

            <View style={styles.legendRow}>
                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: "#22C55E" }]} /><Text style={styles.legendText}>Mastered</Text></View>
                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: "#EAB308" }]} /><Text style={styles.legendText}>Learning</Text></View>
                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: "#EF4444" }]} /><Text style={styles.legendText}>Needs Work</Text></View>
            </View>

            {activeTab === "flashcards" ? (
                <View style={styles.flashcardContainer}>
                    <FlashcardList cards={DEMO_FLASHCARDS} onCardPress={(card) => Alert.alert(card.front, card.back)} staggerMs={120} />
                </View>
            ) : (
                <View style={styles.heatmapContainer}>
                    <View style={styles.noteSimulation}>
                        {Array.from({ length: 12 }).map((_, i) => (
                            <View key={i} style={[styles.noteLine, { width: `${60 + Math.random() * 35}%` }]} />
                        ))}
                    </View>
                    <View style={StyleSheet.absoluteFill}>
                        <HeatmapOverlay imageSource={{ uri: "" }} imageWidth={320} imageHeight={300} boxes={DEMO_BOXES} staggerMs={100} />
                    </View>
                </View>
            )}

            <FadeInView delay={300} style={styles.statsCard}>
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{DEMO_FLASHCARDS.filter((c) => (c.mastery ?? 0) >= 0.7).length}</Text>
                        <Text style={styles.statLabel}>Mastered</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{DEMO_FLASHCARDS.filter((c) => (c.mastery ?? 0) >= 0.4 && (c.mastery ?? 0) < 0.7).length}</Text>
                        <Text style={styles.statLabel}>Learning</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: "#EF4444" }]}>{DEMO_FLASHCARDS.filter((c) => (c.mastery ?? 0) < 0.4).length}</Text>
                        <Text style={styles.statLabel}>Needs Work</Text>
                    </View>
                </View>
            </FadeInView>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0A0A0B" },
    content: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
    screenIcon: { fontSize: 36, marginBottom: 12 },
    title: { fontFamily: "PlayfairDisplay_700Bold", color: "#EAB308", fontSize: 30, marginBottom: 8 },
    subtitle: { fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.45)", fontSize: 14, lineHeight: 20, marginBottom: 24 },
    tabRow: { flexDirection: "row", backgroundColor: "#161618", borderRadius: 14, padding: 4, marginBottom: 20 },
    tab: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
    tabActive: { backgroundColor: "rgba(234,179,8,0.12)" },
    tabText: { fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.35)", fontSize: 14 },
    tabTextActive: { color: "#EAB308" },
    legendRow: { flexDirection: "row", justifyContent: "center", gap: 24, marginBottom: 24 },
    legendItem: { flexDirection: "row", alignItems: "center" },
    legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    legendText: { fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.4)", fontSize: 12 },
    flashcardContainer: { minHeight: 280 },
    heatmapContainer: { minHeight: 300, position: "relative", marginBottom: 16 },
    noteSimulation: { backgroundColor: "#161618", borderRadius: 16, padding: 24, minHeight: 300 },
    noteLine: { height: 8, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 4, marginBottom: 14 },
    statsCard: { backgroundColor: "#161618", borderRadius: 20, padding: 22, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", marginTop: 8 },
    statsRow: { flexDirection: "row" },
    statItem: { flex: 1, alignItems: "center" },
    statValue: { fontFamily: "Inter_700Bold", color: "#FFFFFF", fontSize: 28, marginBottom: 4 },
    statLabel: { fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.4)", fontSize: 12 },
});
