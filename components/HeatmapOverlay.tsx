// ─────────────────────────────────────────────────────────────
// components/HeatmapOverlay.tsx
// Memory Heatmap — neon-bloom bounding-box overlays
// ─────────────────────────────────────────────────────────────

import React from "react";
import {
    StyleSheet, View, Image, type ImageSourcePropType,
} from "react-native";
import FadeInView from "./FadeInView";
import { LinearGradient } from "expo-linear-gradient";

export type HeatmapLevel = "success" | "warning" | "critical";

export interface BoundingBox {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    level: HeatmapLevel;
    label?: string;
}

interface HeatmapOverlayProps {
    imageSource: ImageSourcePropType;
    imageWidth: number;
    imageHeight: number;
    boxes: BoundingBox[];
    staggerMs?: number;
}

const LEVEL_COLORS: Record<HeatmapLevel, { solid: string; glow: string; gradient: [string, string] }> = {
    success: { solid: "#22C55E", glow: "rgba(34,197,94,0.35)", gradient: ["rgba(34,197,94,0.25)", "rgba(34,197,94,0.05)"] },
    warning: { solid: "#EAB308", glow: "rgba(234,179,8,0.35)", gradient: ["rgba(234,179,8,0.25)", "rgba(234,179,8,0.05)"] },
    critical: { solid: "#EF4444", glow: "rgba(239,68,68,0.40)", gradient: ["rgba(239,68,68,0.30)", "rgba(239,68,68,0.08)"] },
};

export default function HeatmapOverlay({ imageSource, imageWidth, imageHeight, boxes, staggerMs = 80 }: HeatmapOverlayProps) {
    const aspectRatio = imageWidth / imageHeight;

    return (
        <View style={styles.wrapper}>
            <Image source={imageSource} style={[styles.image, { aspectRatio }]} resizeMode="contain" />

            <View style={[StyleSheet.absoluteFill, styles.overlayContainer]}>
                {boxes.map((box, index) => {
                    const colors = LEVEL_COLORS[box.level];
                    const delay = index * staggerMs;

                    return (
                        <FadeInView
                            key={box.id}
                            delay={delay}
                            fromScale={0.9}
                            duration={400}
                            style={[styles.boxOuter, { left: box.x, top: box.y, width: box.width, height: box.height }]}
                            accessibilityLabel={box.label ?? `${box.level} region`}
                        >
                            <View style={[StyleSheet.absoluteFill, styles.glowLayer, { shadowColor: colors.solid, borderColor: colors.glow }]} />

                            <LinearGradient
                                colors={colors.gradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={[StyleSheet.absoluteFill, styles.gradientFill]}
                            />

                            <View style={[StyleSheet.absoluteFill, styles.borderHighlight, { borderColor: colors.solid }]} />
                        </FadeInView>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: { width: "100%", position: "relative" },
    image: { width: "100%", borderRadius: 12 },
    overlayContainer: {},
    boxOuter: { position: "absolute", borderRadius: 6, overflow: "visible" },
    glowLayer: { borderRadius: 6, borderWidth: 1, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 14, elevation: 12 },
    gradientFill: { borderRadius: 6 },
    borderHighlight: { borderRadius: 6, borderWidth: 1.5, opacity: 0.7 },
});
