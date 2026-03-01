// ─────────────────────────────────────────────────────────────
// hooks/useFocusTracker.ts
// AI Focus Mode — real-time gaze & eye-closure detection
// 100% local processing via VisionCamera + MLKit Face Detector
// ─────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";
import { Vibration, Platform } from "react-native";
import { Audio } from "expo-av";
import type { Face } from "react-native-vision-camera-face-detector";

// ─────────────────── Config ────────────────────

export interface FocusTrackerConfig {
    /**
     * Max yaw angle (°) before the user is considered looking away.
     * @default 25
     */
    gazeYawThreshold?: number;

    /**
     * Max pitch angle (°) before the user is considered looking away.
     * @default 20
     */
    gazePitchThreshold?: number;

    /**
     * Eye-open probability below which an eye counts as "closed".
     * @default 0.3
     */
    eyeClosedThreshold?: number;

    /**
     * Seconds of consecutive distraction before an alert fires.
     * @default 10
     */
    distractionLimitSeconds?: number;

    /**
     * Vibration pattern (ms) for the alert.
     * @default [0, 400, 200, 400]
     */
    vibrationPattern?: number[];

    /**
     * `require()` path to a local `.mp3`/`.wav` alert sound.
     * If omitted, only vibration is used.
     */
    alertSoundAsset?: number; // value returned by require("./alert.mp3")

    /**
     * Whether the tracker is actively monitoring.
     * @default true
     */
    enabled?: boolean;
}

// ─────────────────── Return type ────────────────────

export interface FocusTrackerState {
    /** Whether the user is currently focused (gaze on-screen + eyes open). */
    isFocused: boolean;
    /** `true` during an active distraction alert. */
    isAlertActive: boolean;
    /** Seconds the user has been continuously distracted. */
    distractionSeconds: number;
    /** Whether a face is detected in the frame at all. */
    faceDetected: boolean;
    /**
     * Callback to be passed as `faceDetectionCallback` on the
     * `<Camera>` component from `react-native-vision-camera-face-detector`.
     */
    handleFacesDetected: (faces: Face[]) => void;
    /** Manually reset the distraction counter and dismiss the alert. */
    resetAlert: () => void;
}

// ─────────────────── Constants ────────────────────

const DEFAULT_YAW_THRESHOLD = 25;
const DEFAULT_PITCH_THRESHOLD = 20;
const DEFAULT_EYE_CLOSED_THRESHOLD = 0.3;
const DEFAULT_DISTRACTION_LIMIT_S = 10;
const DEFAULT_VIBRATION_PATTERN = [0, 400, 200, 400];
const TICK_INTERVAL_MS = 1_000; // 1-second timer tick

// ═════════════════════════════════════════════════════════════
//  HOOK
// ═════════════════════════════════════════════════════════════

/**
 * Custom hook that analyses detected faces in real-time to determine
 * whether the user's gaze has left the screen or their eyes have closed.
 *
 * After `distractionLimitSeconds` of continuous distraction the hook:
 *  1. Fires `Vibration.vibrate()`
 *  2. Plays a local audio alert (if `alertSoundAsset` is provided)
 *
 * All processing is **strictly local** — zero external API calls.
 *
 * @example
 * ```tsx
 * import { Camera, FaceDetectionOptions } from "react-native-vision-camera-face-detector";
 * import { useFocusTracker } from "../hooks/useFocusTracker";
 *
 * const faceDetectionOptions: FaceDetectionOptions = {
 *   performanceMode: "fast",
 *   classificationMode: "all",    // required for eye-open probabilities
 *   landmarkMode: "none",
 *   contourMode: "none",
 *   cameraFacing: "front",
 * };
 *
 * const { handleFacesDetected, isFocused, distractionSeconds } = useFocusTracker({
 *   alertSoundAsset: require("../assets/alert.mp3"),
 * });
 *
 * return (
 *   <Camera
 *     style={StyleSheet.absoluteFill}
 *     device={frontDevice}
 *     isActive={true}
 *     faceDetectionCallback={handleFacesDetected}
 *     faceDetectionOptions={faceDetectionOptions}
 *   />
 * );
 * ```
 */
export function useFocusTracker(
    config: FocusTrackerConfig = {}
): FocusTrackerState {
    const {
        gazeYawThreshold = DEFAULT_YAW_THRESHOLD,
        gazePitchThreshold = DEFAULT_PITCH_THRESHOLD,
        eyeClosedThreshold = DEFAULT_EYE_CLOSED_THRESHOLD,
        distractionLimitSeconds = DEFAULT_DISTRACTION_LIMIT_S,
        vibrationPattern = DEFAULT_VIBRATION_PATTERN,
        alertSoundAsset,
        enabled = true,
    } = config;

    // ────── State ──────
    const [isFocused, setIsFocused] = useState(true);
    const [faceDetected, setFaceDetected] = useState(false);
    const [isAlertActive, setIsAlertActive] = useState(false);
    const [distractionSeconds, setDistractionSeconds] = useState(0);

    // ────── Refs (avoids stale closures) ──────
    const distractionStartRef = useRef<number | null>(null);
    const alertFiredRef = useRef(false);
    const soundRef = useRef<Audio.Sound | null>(null);
    const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ────── Audio helpers ──────

    const loadSound = useCallback(async () => {
        if (!alertSoundAsset) return;
        try {
            const { sound } = await Audio.Sound.createAsync(alertSoundAsset);
            soundRef.current = sound;
        } catch (err) {
            console.warn("[useFocusTracker] Failed to load alert sound:", err);
        }
    }, [alertSoundAsset]);

    const playAlertSound = useCallback(async () => {
        if (!soundRef.current) return;
        try {
            await soundRef.current.setPositionAsync(0);
            await soundRef.current.playAsync();
        } catch (err) {
            console.warn("[useFocusTracker] Failed to play alert sound:", err);
        }
    }, []);

    const unloadSound = useCallback(async () => {
        if (soundRef.current) {
            try {
                await soundRef.current.unloadAsync();
            } catch {
                /* swallow */
            }
            soundRef.current = null;
        }
    }, []);

    // ────── Alert trigger ──────

    const fireAlert = useCallback(() => {
        if (alertFiredRef.current) return;
        alertFiredRef.current = true;
        setIsAlertActive(true);

        // Vibration
        if (Platform.OS === "android") {
            Vibration.vibrate(vibrationPattern);
        } else {
            // iOS only supports simple vibration
            Vibration.vibrate();
        }

        // Audio
        playAlertSound();
    }, [vibrationPattern, playAlertSound]);

    // ────── Reset ──────

    const resetAlert = useCallback(() => {
        distractionStartRef.current = null;
        alertFiredRef.current = false;
        setDistractionSeconds(0);
        setIsAlertActive(false);
        Vibration.cancel();
    }, []);

    // ────── Face analysis callback ──────
    // This is called by the <Camera> via `faceDetectionCallback`.
    // MLKit runs face detection on a native thread; this callback
    // receives the results on the JS thread — no worklet needed.

    const handleFacesDetected = useCallback(
        (faces: Face[]) => {
            if (!enabled) return;

            const hasFace = faces.length > 0;
            setFaceDetected(hasFace);

            if (!hasFace) {
                // No face visible → treat as distracted
                setIsFocused(false);
                if (!distractionStartRef.current) {
                    distractionStartRef.current = Date.now();
                }
                return;
            }

            // Use the primary (first) detected face
            const face = faces[0];

            // ── Gaze check: is the head turned / tilted too far? ──
            const gazeOff =
                Math.abs(face.yawAngle) > gazeYawThreshold ||
                Math.abs(face.pitchAngle) > gazePitchThreshold;

            // ── Eyes check: are both eyes closed? ──
            // leftEyeOpenProbability / rightEyeOpenProbability are
            // available when `classificationMode: "all"` is set.
            const leftEyeOpen = face.leftEyeOpenProbability ?? 1;
            const rightEyeOpen = face.rightEyeOpenProbability ?? 1;
            const eyesClosed =
                leftEyeOpen < eyeClosedThreshold &&
                rightEyeOpen < eyeClosedThreshold;

            const distracted = gazeOff || eyesClosed;

            setIsFocused(!distracted);

            if (distracted) {
                if (!distractionStartRef.current) {
                    distractionStartRef.current = Date.now();
                }
            } else {
                // User came back → reset counter
                resetAlert();
            }
        },
        [
            enabled,
            gazeYawThreshold,
            gazePitchThreshold,
            eyeClosedThreshold,
            resetAlert,
        ]
    );

    // ────── Distraction timer tick ──────

    useEffect(() => {
        if (!enabled) {
            if (tickRef.current) clearInterval(tickRef.current);
            return;
        }

        tickRef.current = setInterval(() => {
            const start = distractionStartRef.current;
            if (!start) {
                setDistractionSeconds(0);
                return;
            }

            const elapsed = Math.floor((Date.now() - start) / 1_000);
            setDistractionSeconds(elapsed);

            if (elapsed >= distractionLimitSeconds && !alertFiredRef.current) {
                fireAlert();
            }
        }, TICK_INTERVAL_MS);

        return () => {
            if (tickRef.current) clearInterval(tickRef.current);
        };
    }, [enabled, distractionLimitSeconds, fireAlert]);

    // ────── Lifecycle ──────

    useEffect(() => {
        loadSound();
        return () => {
            unloadSound();
            Vibration.cancel();
            if (tickRef.current) clearInterval(tickRef.current);
        };
    }, [loadSound, unloadSound]);

    // ────── Public API ──────

    return {
        isFocused,
        isAlertActive,
        distractionSeconds,
        faceDetected,
        handleFacesDetected,
        resetAlert,
    };
}
