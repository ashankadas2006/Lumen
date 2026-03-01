// ─────────────────────────────────────────────────────────────
// components/FlashcardList.tsx
// Animated flashcard deck with sequential fan-out entrance
// ─────────────────────────────────────────────────────────────

import React from "react";
import {
    StyleSheet, Text, View, useWindowDimensions, Pressable,
} from "react-native";
import FadeInView from "./FadeInView";

export interface Flashcard {
    id: string;
    front: string;
    back: string;
    mastery?: number;
}

interface FlashcardListProps {
    cards: Flashcard[];
    onCardPress?: (card: Flashcard, index: number) => void;
    staggerMs?: number;
}

function masteryColor(mastery: number): string {
    if (mastery >= 0.7) return "#22C55E";
    if (mastery >= 0.4) return "#EAB308";
    return "#EF4444";
}

export default function FlashcardList({ cards, onCardPress, staggerMs = 120 }: FlashcardListProps) {
    const { width: screenWidth } = useWindowDimensions();
    const cardWidth = screenWidth - 48;

    return (
        <View style={styles.container}>
            {cards.map((card, index) => {
                const delay = index * staggerMs;
                const borderColor = masteryColor(card.mastery ?? 0);

                return (
                    <FadeInView
                        key={card.id}
                        delay={delay}
                        translateX={80}
                        translateY={40}
                        fromScale={0.85}
                        duration={500}
                        style={[
                            styles.card,
                            { width: cardWidth, borderColor, zIndex: cards.length - index, top: index * 6 },
                        ]}
                    >
                        <Pressable onPress={() => onCardPress?.(card, index)} style={styles.cardInner}>
                            <View style={[styles.badge, { backgroundColor: borderColor }]}>
                                <Text style={styles.badgeText}>{index + 1}</Text>
                            </View>
                            <Text style={styles.frontText} numberOfLines={2}>{card.front}</Text>
                            <View style={styles.divider} />
                            <Text style={styles.backText} numberOfLines={3}>{card.back}</Text>
                            <View style={styles.masteryTrack}>
                                <View style={[styles.masteryFill, { backgroundColor: borderColor, width: `${(card.mastery ?? 0) * 100}%` }]} />
                            </View>
                        </Pressable>
                    </FadeInView>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { alignItems: "center", paddingVertical: 24, paddingHorizontal: 24 },
    card: {
        position: "absolute", backgroundColor: "#161618", borderRadius: 20, borderWidth: 1.5,
        shadowColor: "#D4AF37", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
    },
    cardInner: { padding: 20 },
    badge: { position: "absolute", top: -10, right: 16, width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    badgeText: { color: "#0A0A0B", fontSize: 11, fontWeight: "800" },
    frontText: { fontFamily: "PlayfairDisplay_700Bold", color: "#D4AF37", fontSize: 18, lineHeight: 24, marginBottom: 8 },
    divider: { height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginVertical: 10 },
    backText: { fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.6)", fontSize: 14, lineHeight: 20 },
    masteryTrack: { height: 3, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 2, marginTop: 16, overflow: "hidden" },
    masteryFill: { height: "100%", borderRadius: 2 },
});
