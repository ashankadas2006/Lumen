// ─────────────────────────────────────────────────────────────
// components/FocusCameraView.tsx
// Renders the front camera with MLKit face detection and
// the useFocusTracker hook for AI Focus Mode.
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Text } from "react-native";
import { useCameraDevice, useCameraPermission } from "react-native-vision-camera";
import {
    Camera,
    type FrameFaceDetectionOptions,
} from "react-native-vision-camera-face-detector";
import {
    useFocusTracker,
    type FocusTrackerConfig,
} from "../hooks/useFocusTracker";

// ─────────────────── Props ────────────────────

interface FocusCameraViewProps {
    /** Forward all useFocusTracker config options. */
    trackerConfig?: FocusTrackerConfig;
    /** Called with the current focus state on every detection cycle. */
    onFocusChange?: (isFocused: boolean) => void;
    /** Called when the distraction alert fires. */
    onAlert?: () => void;
    /** Whether the camera & tracker should be active. */
    isActive?: boolean;
    /** Whether to show the live camera preview (false = hidden but still tracking). */
    showPreview?: boolean;
}

// ─────────────────── Face detection config ────────────────────

const FACE_DETECTION_OPTIONS: FrameFaceDetectionOptions = {
    performanceMode: "fast",
    classificationMode: "all", // ← required for eye-open probabilities
    landmarkMode: "none",
    contourMode: "none",
    cameraFacing: "front",
    minFaceSize: 0.15,
    trackingEnabled: true,
};

// ═════════════════════════════════════════════════════════════
//  COMPONENT
// ═════════════════════════════════════════════════════════════

export default function FocusCameraView({
    trackerConfig,
    onFocusChange,
    onAlert,
    isActive = true,
    showPreview = true,
}: FocusCameraViewProps) {
    const device = useCameraDevice("front");
    const { hasPermission, requestPermission } = useCameraPermission();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cameraRef = useRef<any>(null);

    // ── Focus tracker hook ──
    const {
        handleFacesDetected,
        isFocused,
        isAlertActive,
        distractionSeconds,
        faceDetected,
        resetAlert,
    } = useFocusTracker(trackerConfig);

    // ── Ref to track previous focus state (avoids duplicate callbacks) ──
    const prevFocusedRef = useRef(isFocused);

    // Request camera permission on mount
    useEffect(() => {
        if (!hasPermission) {
            requestPermission();
        }
    }, [hasPermission, requestPermission]);

    // Notify parent of focus changes
    useEffect(() => {
        if (isFocused !== prevFocusedRef.current) {
            prevFocusedRef.current = isFocused;
            onFocusChange?.(isFocused);
        }
    }, [isFocused, onFocusChange]);

    // Notify parent when alert fires
    useEffect(() => {
        if (isAlertActive) {
            onAlert?.();
        }
    }, [isAlertActive, onAlert]);

    // ── Render ──

    if (!hasPermission) {
        return (
            <View style={styles.fallback}>
                <Text style={styles.fallbackText}>
                    Camera permission is required for Focus Mode.
                </Text>
            </View>
        );
    }

    if (!device) {
        return (
            <View style={styles.fallback}>
                <Text style={styles.fallbackText}>
                    No front camera found.
                </Text>
            </View>
        );
    }

    return (
        <View
            style={[
                styles.container,
                !showPreview && styles.hiddenPreview,
            ]}
        >
            <Camera
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={isActive}
                faceDetectionCallback={handleFacesDetected}
                faceDetectionOptions={FACE_DETECTION_OPTIONS}
            />

            {/* Optional debug overlay */}
            {showPreview && (
                <View style={styles.overlay} pointerEvents="none">
                    <View
                        style={[
                            styles.statusDot,
                            {
                                backgroundColor: !faceDetected
                                    ? "#EF4444"  // Red — no face
                                    : isFocused
                                        ? "#22C55E"  // Green — focused
                                        : "#F59E0B", // Amber — distracted
                            },
                        ]}
                    />
                    {!isFocused && distractionSeconds > 0 && (
                        <Text style={styles.timerText}>
                            {distractionSeconds}s distracted
                        </Text>
                    )}
                </View>
            )}
        </View>
    );
}

// ─────────────────── Styles ────────────────────

const styles = StyleSheet.create({
    container: {
        width: 120,
        height: 160,
        borderRadius: 16,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    hiddenPreview: {
        width: 1,
        height: 1,
        position: "absolute",
        opacity: 0,
    },
    fallback: {
        width: 120,
        height: 160,
        borderRadius: 16,
        backgroundColor: "#161618",
        alignItems: "center",
        justifyContent: "center",
        padding: 8,
    },
    fallbackText: {
        color: "#666",
        fontSize: 11,
        textAlign: "center",
    },
    overlay: {
        position: "absolute",
        bottom: 8,
        left: 0,
        right: 0,
        alignItems: "center",
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginBottom: 4,
    },
    timerText: {
        color: "#F59E0B",
        fontSize: 10,
        fontWeight: "600",
    },
});
