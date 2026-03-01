// ─────────────────────────────────────────────────────────────
// components/FadeInView.tsx
// Lightweight animated wrapper using react-native-reanimated
// Replaces MotiView — compatible with React 19 / Expo SDK 54
// ─────────────────────────────────────────────────────────────

import React, { useEffect } from "react";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
} from "react-native-reanimated";
import type { ViewProps, ViewStyle } from "react-native";

interface FadeInViewProps extends ViewProps {
    /** Delay before the animation starts (ms). @default 0 */
    delay?: number;
    /** Duration of the animation (ms). @default 500 */
    duration?: number;
    /** Vertical offset to animate from. @default 20 */
    translateY?: number;
    /** Horizontal offset to animate from. @default 0 */
    translateX?: number;
    /** Starting scale. @default 1 */
    fromScale?: number;
    children?: React.ReactNode;
}

export default function FadeInView({
    delay = 0,
    duration = 500,
    translateY: fromY = 20,
    translateX: fromX = 0,
    fromScale = 1,
    style,
    children,
    ...rest
}: FadeInViewProps) {
    const opacity = useSharedValue(0);
    const ty = useSharedValue(fromY);
    const tx = useSharedValue(fromX);
    const scale = useSharedValue(fromScale);

    useEffect(() => {
        opacity.value = withDelay(delay, withTiming(1, { duration }));
        ty.value = withDelay(delay, withTiming(0, { duration }));
        tx.value = withDelay(delay, withTiming(0, { duration }));
        scale.value = withDelay(delay, withTiming(1, { duration }));
    }, [delay, duration, opacity, ty, tx, scale]);

    const animStyle = useAnimatedStyle<ViewStyle>(() => ({
        opacity: opacity.value,
        transform: [
            { translateY: ty.value },
            { translateX: tx.value },
            { scale: scale.value },
        ],
    }));

    return (
        <Animated.View style={[animStyle, style]} {...rest}>
            {children}
        </Animated.View>
    );
}
