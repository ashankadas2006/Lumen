// ─────────────────────────────────────────────────────────────
// services/audio.ts
// "The Socratic Commute" — ElevenLabs TTS, playback manager
// with Socratic pause-points, mic recording, and Whisper STT
// ─────────────────────────────────────────────────────────────

import { Audio, type AVPlaybackStatus } from "expo-av";
import { Paths, File as ExpoFile } from "expo-file-system";

// ═════════════════════════════════════════════════════════════
//  TYPES
// ═════════════════════════════════════════════════════════════

/** A Socratic Question marker inserted into the audio timeline. */
export interface SocraticMarker {
    /** Timestamp (ms) at which the audio should pause. */
    timestampMs: number;
    /** The question displayed / spoken to the student. */
    question: string;
    /** Optional expected keywords for answer verification. */
    expectedKeywords?: string[];
}

/** Options for generating an audio lesson. */
export interface GenerateAudioOptions {
    /** Summarized study text to convert to speech. */
    text: string;
    /** ElevenLabs voice ID (default: "21m00Tcm4TlvDq8ikWAM" — Rachel). */
    voiceId?: string;
    /** ElevenLabs model ID (default: "eleven_multilingual_v2"). */
    modelId?: string;
    /** Stability 0..1 (default: 0.5). */
    stability?: number;
    /** Similarity boost 0..1 (default: 0.75). */
    similarityBoost?: number;
}

/** Result of speech-to-text transcription. */
export interface TranscriptionResult {
    /** The transcribed text. */
    text: string;
    /** Confidence score 0..1 (if available). */
    confidence?: number;
    /** Duration of the recording in ms. */
    durationMs?: number;
}

/** State emitted by the playback manager. */
export interface PlaybackState {
    isPlaying: boolean;
    isPausedForQuestion: boolean;
    isRecording: boolean;
    positionMs: number;
    durationMs: number;
    currentMarker: SocraticMarker | null;
}

/** Callback for playback state changes. */
export type PlaybackStateCallback = (state: PlaybackState) => void;

/** Callback when a user's answer has been transcribed. */
export type AnswerCallback = (
    marker: SocraticMarker,
    transcription: TranscriptionResult
) => void;

// ═════════════════════════════════════════════════════════════
//  ERRORS
// ═════════════════════════════════════════════════════════════

export type AudioErrorCode =
    | "API_KEY_MISSING"
    | "TTS_FAILED"
    | "PLAYBACK_FAILED"
    | "RECORDING_FAILED"
    | "TRANSCRIPTION_FAILED"
    | "PERMISSION_DENIED";

export class AudioServiceError extends Error {
    constructor(
        message: string,
        public readonly code: AudioErrorCode,
        public readonly cause?: unknown
    ) {
        super(message);
        this.name = "AudioServiceError";
    }
}

// ═════════════════════════════════════════════════════════════
//  1. ELEVENLABS TTS
// ═════════════════════════════════════════════════════════════

const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel
const DEFAULT_MODEL_ID = "eleven_multilingual_v2";

function getElevenLabsKey(): string {
    const key = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;
    if (!key) {
        throw new AudioServiceError(
            "EXPO_PUBLIC_ELEVENLABS_API_KEY is not set. " +
            "Add it to your .env file.",
            "API_KEY_MISSING"
        );
    }
    return key;
}

/**
 * Sends summarized study text to the ElevenLabs API and returns a
 * local file URI pointing to the generated MP3 audio buffer.
 *
 * @returns Local `file://` URI of the generated audio.
 *
 * @example
 * ```ts
 * const uri = await generateSpeech({ text: "Newton's third law..." });
 * // uri → "file:///…/socratic_1708789200000.mp3"
 * ```
 */
export async function generateSpeech(
    options: GenerateAudioOptions
): Promise<string> {
    const {
        text,
        voiceId = DEFAULT_VOICE_ID,
        modelId = DEFAULT_MODEL_ID,
        stability = 0.5,
        similarityBoost = 0.75,
    } = options;

    if (!text.trim()) {
        throw new AudioServiceError(
            "Cannot generate speech from empty text.",
            "TTS_FAILED"
        );
    }

    try {
        const apiKey = getElevenLabsKey();
        const url = `${ELEVENLABS_BASE}/text-to-speech/${voiceId}`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "xi-api-key": apiKey,
                Accept: "audio/mpeg",
            },
            body: JSON.stringify({
                text,
                model_id: modelId,
                voice_settings: {
                    stability,
                    similarity_boost: similarityBoost,
                },
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text().catch(() => "");
            throw new AudioServiceError(
                `ElevenLabs API error ${response.status}: ${errorBody}`,
                "TTS_FAILED"
            );
        }

        // Read the response as a blob → write to local cache file
        const arrayBuffer = await response.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer);

        const outputFile = new ExpoFile(
            Paths.cache,
            `socratic_${Date.now()}.mp3`
        );
        outputFile.create({ intermediates: true });
        outputFile.write(uint8);

        return outputFile.uri;
    } catch (error) {
        if (error instanceof AudioServiceError) throw error;
        throw new AudioServiceError(
            `TTS generation failed: ${error instanceof Error ? error.message : String(error)}`,
            "TTS_FAILED",
            error
        );
    }
}



// ═════════════════════════════════════════════════════════════
//  2. WHISPER SPEECH-TO-TEXT (placeholder / on-device)
// ═════════════════════════════════════════════════════════════

/**
 * Transcribes a recorded audio file to text.
 *
 * This is currently a **placeholder** that calls the OpenAI Whisper API.
 * Replace the implementation body with an on-device Whisper model
 * (e.g., whisper.rn or whisper.cpp) for fully offline transcription.
 *
 * @param audioUri  Local `file://` URI of the recorded audio.
 * @returns         Transcribed text + optional confidence score.
 */
export async function transcribeAudio(
    audioUri: string
): Promise<TranscriptionResult> {
    try {
        // ─── Option A: OpenAI Whisper API (remote) ───
        const whisperKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

        if (whisperKey) {
            return await whisperApiTranscribe(audioUri, whisperKey);
        }

        // ─── Option B: On-device placeholder ───
        // When no API key is set, fall back to a stub.
        // Replace this with whisper.rn / whisper.cpp integration.
        console.warn(
            "[audio.ts] No EXPO_PUBLIC_OPENAI_API_KEY set — " +
            "using placeholder transcription. Integrate whisper.rn " +
            "for on-device STT."
        );

        return {
            text: "[Placeholder transcription — integrate whisper.rn for on-device STT]",
            confidence: 0,
            durationMs: 0,
        };
    } catch (error) {
        if (error instanceof AudioServiceError) throw error;
        throw new AudioServiceError(
            `Transcription failed: ${error instanceof Error ? error.message : String(error)}`,
            "TRANSCRIPTION_FAILED",
            error
        );
    }
}

/** Call OpenAI Whisper API to transcribe audio. */
async function whisperApiTranscribe(
    audioUri: string,
    apiKey: string
): Promise<TranscriptionResult> {
    const fileInfo = Paths.info(audioUri);
    if (!fileInfo.exists || fileInfo.isDirectory) {
        throw new AudioServiceError(
            `Recording file not found: ${audioUri}`,
            "TRANSCRIPTION_FAILED"
        );
    }

    // Build a FormData upload with the file URI

    const formData = new FormData();
    formData.append("file", {
        uri: audioUri,
        type: "audio/m4a",
        name: "recording.m4a",
    } as unknown as Blob);
    formData.append("model", "whisper-1");
    formData.append("response_format", "json");

    const response = await fetch(
        "https://api.openai.com/v1/audio/transcriptions",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
            body: formData,
        }
    );

    if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new AudioServiceError(
            `Whisper API error ${response.status}: ${errText}`,
            "TRANSCRIPTION_FAILED"
        );
    }

    const data = (await response.json()) as { text: string };

    return {
        text: data.text,
        confidence: 1.0,
    };
}

// ═════════════════════════════════════════════════════════════
//  3. SOCRATIC PLAYBACK MANAGER
// ═════════════════════════════════════════════════════════════

/**
 * Manages audio playback of a generated lesson, pausing at
 * Socratic question markers to record the user's spoken answer.
 *
 * **Flow:**
 * ```
 * Play audio → hit marker → pause → show question →
 * record mic → transcribe → fire callback → resume
 * ```
 *
 * @example
 * ```ts
 * const manager = new SocraticPlaybackManager();
 *
 * manager.onStateChange((state) => {
 *   console.log("Playing:", state.isPlaying);
 * });
 *
 * manager.onAnswer((marker, transcription) => {
 *   console.log(`Q: ${marker.question}`);
 *   console.log(`A: ${transcription.text}`);
 * });
 *
 * await manager.load(audioUri, markers);
 * await manager.play();
 * ```
 */
export class SocraticPlaybackManager {
    // ── Internal state ──
    private sound: Audio.Sound | null = null;
    private recording: Audio.Recording | null = null;
    private markers: SocraticMarker[] = [];
    private firedMarkerIndices = new Set<number>();
    private pollTimer: ReturnType<typeof setInterval> | null = null;
    private isLoaded = false;

    // ── Current state ──
    private state: PlaybackState = {
        isPlaying: false,
        isPausedForQuestion: false,
        isRecording: false,
        positionMs: 0,
        durationMs: 0,
        currentMarker: null,
    };

    // ── Callbacks ──
    private stateCallbacks: PlaybackStateCallback[] = [];
    private answerCallbacks: AnswerCallback[] = [];

    // ── Poll interval for checking marker timestamps ──
    private static readonly POLL_INTERVAL_MS = 250;

    // ── Marker hit tolerance (±ms) ──
    private static readonly MARKER_TOLERANCE_MS = 500;

    // ─────────────── Lifecycle ───────────────

    /**
     * Loads an audio file and registers Socratic question markers.
     *
     * @param audioUri  Local `file://` URI (from `generateSpeech`).
     * @param markers   Array of pause-point markers sorted by timestamp.
     */
    async load(
        audioUri: string,
        markers: SocraticMarker[] = []
    ): Promise<void> {
        await this.unload();

        try {
            // Configure audio mode for playback + recording
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                staysActiveInBackground: true,
                shouldDuckAndroid: true,
            });

            const { sound } = await Audio.Sound.createAsync(
                { uri: audioUri },
                { shouldPlay: false, progressUpdateIntervalMillis: 200 },
                this.onPlaybackStatusUpdate
            );

            this.sound = sound;
            this.markers = [...markers].sort(
                (a, b) => a.timestampMs - b.timestampMs
            );
            this.firedMarkerIndices.clear();
            this.isLoaded = true;
        } catch (error) {
            throw new AudioServiceError(
                `Failed to load audio: ${error instanceof Error ? error.message : String(error)}`,
                "PLAYBACK_FAILED",
                error
            );
        }
    }

    /** Releases all resources. */
    async unload(): Promise<void> {
        this.stopPolling();
        await this.stopRecordingInternal();

        if (this.sound) {
            try {
                await this.sound.unloadAsync();
            } catch {
                /* swallow */
            }
            this.sound = null;
        }

        this.isLoaded = false;
        this.firedMarkerIndices.clear();
        this.updateState({
            isPlaying: false,
            isPausedForQuestion: false,
            isRecording: false,
            positionMs: 0,
            durationMs: 0,
            currentMarker: null,
        });
    }

    // ─────────────── Playback controls ───────────────

    /** Start or resume playback. */
    async play(): Promise<void> {
        this.ensureLoaded();
        await this.sound!.playAsync();
        this.startPolling();
        this.updateState({ isPlaying: true, isPausedForQuestion: false });
    }

    /** Pause playback manually. */
    async pause(): Promise<void> {
        this.ensureLoaded();
        await this.sound!.pauseAsync();
        this.stopPolling();
        this.updateState({ isPlaying: false });
    }

    /** Seek to a specific position. */
    async seekTo(positionMs: number): Promise<void> {
        this.ensureLoaded();
        await this.sound!.setPositionAsync(positionMs);
        this.updateState({ positionMs });
    }

    /** Reset to the beginning (also clears fired markers). */
    async restart(): Promise<void> {
        this.ensureLoaded();
        await this.sound!.setPositionAsync(0);
        this.firedMarkerIndices.clear();
        this.updateState({
            positionMs: 0,
            isPausedForQuestion: false,
            currentMarker: null,
        });
    }

    // ─────────────── Socratic question flow ───────────────

    /**
     * Called when a Socratic marker is hit.
     * Pauses playback, notifies subscribers, and waits for
     * `recordAnswer()` → `submitAnswer()` cycle.
     */
    private async onMarkerHit(marker: SocraticMarker): Promise<void> {
        await this.sound!.pauseAsync();
        this.stopPolling();
        this.updateState({
            isPlaying: false,
            isPausedForQuestion: true,
            currentMarker: marker,
        });
    }

    /**
     * Starts recording the user's spoken answer via the device microphone.
     * Call this when the UI indicates the user is ready to answer.
     *
     * @throws {AudioServiceError} If mic permission is denied.
     */
    async recordAnswer(): Promise<void> {
        this.ensureLoaded();

        if (!this.state.isPausedForQuestion) {
            throw new AudioServiceError(
                "Cannot record — audio is not paused for a question.",
                "RECORDING_FAILED"
            );
        }

        try {
            // Request microphone permission
            const { granted } = await Audio.requestPermissionsAsync();
            if (!granted) {
                throw new AudioServiceError(
                    "Microphone permission denied.",
                    "PERMISSION_DENIED"
                );
            }

            // Prepare and start recording
            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            this.recording = recording;
            this.updateState({ isRecording: true });
        } catch (error) {
            if (error instanceof AudioServiceError) throw error;
            throw new AudioServiceError(
                `Failed to start recording: ${error instanceof Error ? error.message : String(error)}`,
                "RECORDING_FAILED",
                error
            );
        }
    }

    /**
     * Stops recording, transcribes the answer via Whisper, fires the
     * answer callback, and resumes playback.
     *
     * @returns The transcription result.
     */
    async submitAnswer(): Promise<TranscriptionResult> {
        if (!this.recording) {
            throw new AudioServiceError(
                "No active recording to submit.",
                "RECORDING_FAILED"
            );
        }

        const marker = this.state.currentMarker;
        if (!marker) {
            throw new AudioServiceError(
                "No active Socratic marker.",
                "RECORDING_FAILED"
            );
        }

        try {
            // Stop the recording
            await this.recording.stopAndUnloadAsync();
            const recordingUri = this.recording.getURI();
            this.recording = null;
            this.updateState({ isRecording: false });

            if (!recordingUri) {
                throw new AudioServiceError(
                    "Recording URI is null.",
                    "RECORDING_FAILED"
                );
            }

            // Transcribe via Whisper
            const transcription = await transcribeAudio(recordingUri);

            // Notify answer subscribers
            for (const cb of this.answerCallbacks) {
                try {
                    cb(marker, transcription);
                } catch {
                    /* swallow subscriber errors */
                }
            }

            // Clean up the temp recording file
            try {
                const tempFile = new ExpoFile(recordingUri);
                tempFile.delete();
            } catch {
                /* non-critical */
            }

            // Resume playback
            await this.play();

            return transcription;
        } catch (error) {
            if (error instanceof AudioServiceError) throw error;
            throw new AudioServiceError(
                `Answer submission failed: ${error instanceof Error ? error.message : String(error)}`,
                "RECORDING_FAILED",
                error
            );
        }
    }

    /**
     * Skips the current Socratic question without answering
     * and resumes playback.
     */
    async skipQuestion(): Promise<void> {
        await this.stopRecordingInternal();
        this.updateState({
            isPausedForQuestion: false,
            isRecording: false,
            currentMarker: null,
        });
        await this.play();
    }

    // ─────────────── Callbacks ───────────────

    /** Subscribe to playback state changes. Returns an unsubscribe function. */
    onStateChange(cb: PlaybackStateCallback): () => void {
        this.stateCallbacks.push(cb);
        // Immediately emit current state
        cb({ ...this.state });
        return () => {
            this.stateCallbacks = this.stateCallbacks.filter((fn) => fn !== cb);
        };
    }

    /** Subscribe to answer events. Returns an unsubscribe function. */
    onAnswer(cb: AnswerCallback): () => void {
        this.answerCallbacks.push(cb);
        return () => {
            this.answerCallbacks = this.answerCallbacks.filter((fn) => fn !== cb);
        };
    }

    // ─────────────── Internals ───────────────

    /** Expo-AV playback status handler. */
    private onPlaybackStatusUpdate = (status: AVPlaybackStatus): void => {
        if (!status.isLoaded) return;

        this.updateState({
            positionMs: status.positionMillis ?? 0,
            durationMs: status.durationMillis ?? 0,
            isPlaying: status.isPlaying ?? false,
        });

        // Handle natural end of audio
        if (status.didJustFinish) {
            this.stopPolling();
            this.updateState({ isPlaying: false });
        }
    };

    /** Polls for marker proximity while playing. */
    private startPolling(): void {
        this.stopPolling();
        this.pollTimer = setInterval(() => {
            this.checkMarkers();
        }, SocraticPlaybackManager.POLL_INTERVAL_MS);
    }

    private stopPolling(): void {
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
    }

    /** Checks if the current position has reached any unfired marker. */
    private async checkMarkers(): Promise<void> {
        if (!this.sound || this.state.isPausedForQuestion) return;

        const pos = this.state.positionMs;
        const tolerance = SocraticPlaybackManager.MARKER_TOLERANCE_MS;

        for (let i = 0; i < this.markers.length; i++) {
            if (this.firedMarkerIndices.has(i)) continue;

            const marker = this.markers[i];
            if (
                pos >= marker.timestampMs - tolerance &&
                pos <= marker.timestampMs + tolerance
            ) {
                this.firedMarkerIndices.add(i);
                await this.onMarkerHit(marker);
                return; // Only one marker at a time
            }
        }
    }

    /** Safely stops any active recording. */
    private async stopRecordingInternal(): Promise<void> {
        if (this.recording) {
            try {
                await this.recording.stopAndUnloadAsync();
            } catch {
                /* swallow */
            }
            this.recording = null;
        }
    }

    /** Merges partial state and notifies subscribers. */
    private updateState(partial: Partial<PlaybackState>): void {
        this.state = { ...this.state, ...partial };
        for (const cb of this.stateCallbacks) {
            try {
                cb({ ...this.state });
            } catch {
                /* swallow subscriber errors */
            }
        }
    }

    /** Guard: ensures audio is loaded. */
    private ensureLoaded(): void {
        if (!this.isLoaded || !this.sound) {
            throw new AudioServiceError(
                "No audio loaded. Call load() first.",
                "PLAYBACK_FAILED"
            );
        }
    }
}
