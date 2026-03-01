// ─────────────────────────────────────────────────────────────
// screens/SocraticCommuteScreen.tsx
// Socratic Commute — TTS from study text + Socratic Q&A
// ─────────────────────────────────────────────────────────────

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
    View, Text, TextInput, ScrollView, Pressable,
    ActivityIndicator, StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import FadeInView from "../components/FadeInView";
import {
    generateSpeech, SocraticPlaybackManager,
    type PlaybackState, type SocraticMarker, type TranscriptionResult,
} from "../services/audio";

export default function SocraticCommuteScreen() {
    const [studyText, setStudyText] = useState("");
    const [generating, setGenerating] = useState(false);
    const [audioLoaded, setAudioLoaded] = useState(false);
    const [playbackState, setPlaybackState] = useState<PlaybackState>({
        isPlaying: false, isPausedForQuestion: false, isRecording: false,
        positionMs: 0, durationMs: 0, currentMarker: null,
    });
    const [answers, setAnswers] = useState<{ question: string; answer: string }[]>([]);
    const managerRef = useRef<SocraticPlaybackManager | null>(null);

    useEffect(() => { return () => { managerRef.current?.unload(); }; }, []);

    const handleGenerate = useCallback(async () => {
        if (!studyText.trim()) { Alert.alert("Empty", "Please enter your study notes."); return; }
        setGenerating(true); setAudioLoaded(false); setAnswers([]);
        try {
            const audioUri = await generateSpeech({ text: studyText.trim() });
            const markers: SocraticMarker[] = [
                { timestampMs: 8000, question: "Can you summarise the main concept in your own words?", expectedKeywords: [] },
                { timestampMs: Math.min(20000, studyText.length * 15), question: "What is a real-world example of this principle?", expectedKeywords: [] },
            ];
            const manager = new SocraticPlaybackManager();
            manager.onStateChange((state) => setPlaybackState({ ...state }));
            manager.onAnswer((marker: SocraticMarker, transcription: TranscriptionResult) => {
                setAnswers((prev) => [...prev, { question: marker.question, answer: transcription.text }]);
            });
            await manager.load(audioUri, markers);
            managerRef.current = manager;
            setAudioLoaded(true);
        } catch (error) {
            Alert.alert("Error", error instanceof Error ? error.message : "Failed to generate audio.");
        } finally { setGenerating(false); }
    }, [studyText]);

    const handlePlayPause = async () => { if (!managerRef.current) return; playbackState.isPlaying ? await managerRef.current.pause() : await managerRef.current.play(); };
    const handleRecord = async () => { if (!managerRef.current) return; playbackState.isRecording ? await managerRef.current.submitAnswer() : await managerRef.current.recordAnswer(); };
    const handleSkip = async () => { await managerRef.current?.skipQuestion(); };

    const formatMs = (ms: number) => { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`; };
    const progress = playbackState.durationMs > 0 ? playbackState.positionMs / playbackState.durationMs : 0;

    return (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <FadeInView delay={0} translateY={-15}>
                    <Text style={styles.screenIcon}>🎧</Text>
                    <Text style={styles.title}>Socratic Commute</Text>
                    <Text style={styles.subtitle}>Convert your notes to audio and answer Socratic questions along the way.</Text>
                </FadeInView>

                {!audioLoaded && (
                    <FadeInView delay={100}>
                        <TextInput style={[styles.input, styles.textArea]} value={studyText} onChangeText={setStudyText} placeholder="Paste your study notes here..." placeholderTextColor="rgba(255,255,255,0.2)" multiline numberOfLines={5} textAlignVertical="top" />
                        <Pressable onPress={handleGenerate} disabled={generating} style={({ pressed }) => [styles.button, styles.buttonGenerate, pressed && styles.buttonPressed, generating && styles.buttonDisabled]}>
                            {generating ? <ActivityIndicator color="#0A0A0B" /> : <Text style={styles.buttonTextDark}>🎙️  Generate Audio Lesson</Text>}
                        </Pressable>
                    </FadeInView>
                )}

                {audioLoaded && (
                    <FadeInView delay={0} style={styles.playerCard}>
                        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress * 100}%` }]} /></View>
                        <View style={styles.timeRow}>
                            <Text style={styles.timeText}>{formatMs(playbackState.positionMs)}</Text>
                            <Text style={styles.timeText}>{formatMs(playbackState.durationMs)}</Text>
                        </View>
                        <View style={styles.controlsRow}>
                            <Pressable onPress={handlePlayPause} style={[styles.controlBtn, styles.playBtn]}>
                                <Text style={styles.controlBtnText}>{playbackState.isPlaying ? "⏸" : "▶️"}</Text>
                            </Pressable>
                        </View>

                        {playbackState.isPausedForQuestion && playbackState.currentMarker && (
                            <FadeInView delay={0} fromScale={0.95} style={styles.questionCard}>
                                <Text style={styles.questionLabel}>💡 Socratic Question</Text>
                                <Text style={styles.questionText}>{playbackState.currentMarker.question}</Text>
                                <View style={styles.questionActions}>
                                    <Pressable onPress={handleRecord} style={[styles.button, playbackState.isRecording ? styles.buttonStop : styles.buttonRecord]}>
                                        <Text style={playbackState.isRecording ? styles.buttonTextLight : styles.buttonTextDark}>{playbackState.isRecording ? "⏹  Stop & Submit" : "🎤  Record Answer"}</Text>
                                    </Pressable>
                                    <Pressable onPress={handleSkip} style={[styles.button, styles.buttonSkip]}>
                                        <Text style={styles.buttonTextLight}>Skip →</Text>
                                    </Pressable>
                                </View>
                            </FadeInView>
                        )}
                    </FadeInView>
                )}

                {answers.length > 0 && (
                    <FadeInView delay={0} style={styles.answersSection}>
                        <Text style={styles.answersTitle}>Your Answers</Text>
                        {answers.map((a, i) => (
                            <View key={i} style={styles.answerCard}>
                                <Text style={styles.answerQ}>Q: {a.question}</Text>
                                <Text style={styles.answerA}>A: {a.answer}</Text>
                            </View>
                        ))}
                    </FadeInView>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: "#0A0A0B" },
    container: { flex: 1 },
    content: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
    screenIcon: { fontSize: 36, marginBottom: 12 },
    title: { fontFamily: "PlayfairDisplay_700Bold", color: "#22C55E", fontSize: 30, marginBottom: 8 },
    subtitle: { fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.45)", fontSize: 14, lineHeight: 20, marginBottom: 28 },
    input: { backgroundColor: "#161618", borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", color: "#FFFFFF", fontFamily: "Inter_400Regular", fontSize: 15, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 16 },
    textArea: { height: 130, paddingTop: 14 },
    button: { borderRadius: 14, paddingVertical: 14, alignItems: "center", marginBottom: 12 },
    buttonGenerate: { backgroundColor: "#22C55E" },
    buttonRecord: { backgroundColor: "#D4AF37" },
    buttonStop: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: "#EF4444" },
    buttonSkip: { backgroundColor: "transparent", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
    buttonPressed: { opacity: 0.85 },
    buttonDisabled: { opacity: 0.6 },
    buttonTextDark: { fontFamily: "Inter_700Bold", color: "#0A0A0B", fontSize: 15 },
    buttonTextLight: { fontFamily: "Inter_500Medium", color: "#FFFFFF", fontSize: 14 },
    playerCard: { backgroundColor: "#161618", borderRadius: 20, padding: 22, borderWidth: 1, borderColor: "rgba(34,197,94,0.15)", marginBottom: 24 },
    progressTrack: { height: 4, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 2, marginBottom: 8, overflow: "hidden" },
    progressFill: { height: "100%", backgroundColor: "#22C55E", borderRadius: 2 },
    timeRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
    timeText: { fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.3)", fontSize: 11 },
    controlsRow: { flexDirection: "row", justifyContent: "center", marginBottom: 16 },
    controlBtn: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
    playBtn: { backgroundColor: "rgba(34,197,94,0.15)" },
    controlBtnText: { fontSize: 24 },
    questionCard: { backgroundColor: "rgba(212,175,55,0.07)", borderRadius: 16, padding: 18, borderWidth: 1, borderColor: "rgba(212,175,55,0.15)" },
    questionLabel: { fontFamily: "Inter_500Medium", color: "#D4AF37", fontSize: 12, marginBottom: 8 },
    questionText: { fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.75)", fontSize: 15, lineHeight: 22, marginBottom: 16 },
    questionActions: { gap: 8 },
    answersSection: { marginTop: 8 },
    answersTitle: { fontFamily: "Inter_700Bold", color: "rgba(255,255,255,0.5)", fontSize: 14, marginBottom: 12 },
    answerCard: { backgroundColor: "#161618", borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.04)" },
    answerQ: { fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 6 },
    answerA: { fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)", fontSize: 14, lineHeight: 20 },
});
