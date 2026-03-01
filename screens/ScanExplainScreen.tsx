// ─────────────────────────────────────────────────────────────
// screens/ScanExplainScreen.tsx
// Scan + OCR + Analogy Engine screen
// ─────────────────────────────────────────────────────────────

import React, { useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TextInput,
    Pressable,
    ActivityIndicator,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import FadeInView from "../components/FadeInView";
import { generateAnalogies } from "../services/gemini";

export default function ScanExplainScreen() {
    const [studyText, setStudyText] = useState("");
    const [major, setMajor] = useState("Computer Science");
    const [result, setResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleExplain = async () => {
        if (!studyText.trim()) {
            Alert.alert("Empty Notes", "Please paste or type your study notes.");
            return;
        }
        setLoading(true);
        setResult(null);
        try {
            const explanation = await generateAnalogies(studyText.trim(), major);
            setResult(explanation);
        } catch (error) {
            Alert.alert("Error", error instanceof Error ? error.message : "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <FadeInView delay={0} translateY={-15}>
                    <Text style={styles.screenIcon}>📸</Text>
                    <Text style={styles.title}>Scan &amp; Explain</Text>
                    <Text style={styles.subtitle}>Paste your notes below and get analogy-driven explanations powered by Gemini.</Text>
                </FadeInView>

                <FadeInView delay={100}>
                    <Text style={styles.label}>Your Major</Text>
                    <TextInput style={styles.input} value={major} onChangeText={setMajor} placeholder="e.g. Computer Science" placeholderTextColor="rgba(255,255,255,0.2)" />
                </FadeInView>

                <FadeInView delay={200}>
                    <Text style={styles.label}>Study Notes</Text>
                    <TextInput style={[styles.input, styles.textArea]} value={studyText} onChangeText={setStudyText} placeholder="Paste or type your study notes here..." placeholderTextColor="rgba(255,255,255,0.2)" multiline numberOfLines={6} textAlignVertical="top" />
                </FadeInView>

                <FadeInView delay={300} fromScale={0.95}>
                    <Pressable onPress={handleExplain} disabled={loading} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, loading && styles.buttonDisabled]}>
                        {loading ? <ActivityIndicator color="#0A0A0B" /> : <Text style={styles.buttonText}>✨ Explain with Analogies</Text>}
                    </Pressable>
                </FadeInView>

                {result && (
                    <FadeInView delay={0} style={styles.resultCard}>
                        <View style={styles.resultHeader}>
                            <View style={styles.resultDot} />
                            <Text style={styles.resultLabel}>AI Explanation</Text>
                        </View>
                        <Text style={styles.resultText}>{result}</Text>
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
    title: { fontFamily: "PlayfairDisplay_700Bold", color: "#D4AF37", fontSize: 30, marginBottom: 8 },
    subtitle: { fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.45)", fontSize: 14, lineHeight: 20, marginBottom: 32 },
    label: { fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.6)", fontSize: 13, marginBottom: 8, marginTop: 4 },
    input: { backgroundColor: "#161618", borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", color: "#FFFFFF", fontFamily: "Inter_400Regular", fontSize: 15, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 16 },
    textArea: { height: 150, paddingTop: 14 },
    button: { backgroundColor: "#D4AF37", borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 8, marginBottom: 24 },
    buttonPressed: { opacity: 0.85 },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { fontFamily: "Inter_700Bold", color: "#0A0A0B", fontSize: 16 },
    resultCard: { backgroundColor: "#161618", borderRadius: 20, padding: 22, borderWidth: 1, borderColor: "rgba(212,175,55,0.15)" },
    resultHeader: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
    resultDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#6366F1", marginRight: 8 },
    resultLabel: { fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.5)", fontSize: 12 },
    resultText: { fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.75)", fontSize: 14, lineHeight: 22 },
});
