// ─────────────────────────────────────────────────────────────
// services/gemini.ts
// Gemini 2.0 Flash — OCR extraction & Analogy Engine
// ─────────────────────────────────────────────────────────────

import {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
    type GenerateContentResult,
} from "@google/generative-ai";
import { OCR_SYSTEM_PROMPT, buildAnalogyPrompt } from "./promptTemplates";

// ─────────────────── Config ────────────────────

const GEMINI_MODEL = "gemini-2.0-flash";

/**
 * Reads the API key from an environment variable.
 * In Expo, you'd typically set this in `app.json` > `extra` or via
 * `expo-constants` / a `.env` file loaded through `expo-env`.
 *
 * For now we pull from `process.env` — replace with your preferred
 * secret-management approach before shipping to production.
 */
function getApiKey(): string {
    const key = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!key) {
        throw new GeminiServiceError(
            "EXPO_PUBLIC_GEMINI_API_KEY is not set. " +
            "Add it to your .env file or app.json > extra.",
            "API_KEY_MISSING"
        );
    }
    return key;
}

// Safety settings — relaxed for academic content
const SAFETY_SETTINGS = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
];

// ─────────────────── Error class ────────────────────

export type GeminiErrorCode =
    | "API_KEY_MISSING"
    | "OCR_FAILED"
    | "ANALOGY_FAILED"
    | "EMPTY_RESPONSE"
    | "NETWORK_ERROR"
    | "BLOCKED_CONTENT";

export class GeminiServiceError extends Error {
    constructor(
        message: string,
        public readonly code: GeminiErrorCode,
        public readonly cause?: unknown
    ) {
        super(message);
        this.name = "GeminiServiceError";
    }
}

// ─────────────────── Singleton client ────────────────────

let _client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
    if (!_client) {
        _client = new GoogleGenerativeAI(getApiKey());
    }
    return _client;
}

// ─────────────────── Helpers ────────────────────

/**
 * Safely extracts text from a Gemini response, throwing a
 * typed error if the response is empty or blocked.
 */
function extractText(
    result: GenerateContentResult,
    errorCode: GeminiErrorCode
): string {
    const response = result.response;

    // Check for content filter blocks
    if (
        response.promptFeedback?.blockReason
    ) {
        throw new GeminiServiceError(
            `Content was blocked by safety filters: ${response.promptFeedback.blockReason}`,
            "BLOCKED_CONTENT"
        );
    }

    const text = response.text();

    if (!text || text.trim().length === 0) {
        throw new GeminiServiceError(
            "Gemini returned an empty response.",
            "EMPTY_RESPONSE"
        );
    }

    return text.trim();
}

// ═════════════════════════════════════════════════════════════
//  PUBLIC API
// ═════════════════════════════════════════════════════════════

/**
 * Extracts text from a scanned note image via Gemini 2.0 Flash.
 *
 * @param base64ImageData  Base64-encoded image data (no data URI prefix).
 * @param mimeType         MIME type of the image (default: `image/jpeg`).
 * @returns                Extracted text preserving math, formulas & diagrams.
 *
 * @throws {GeminiServiceError} On API key issues, network errors,
 *                              blocked content, or empty responses.
 *
 * @example
 * ```ts
 * const text = await extractTextFromImage(base64String, "image/png");
 * console.log(text);
 * ```
 */
export async function extractTextFromImage(
    base64ImageData: string,
    mimeType: "image/jpeg" | "image/png" | "image/webp" = "image/jpeg"
): Promise<string> {
    try {
        const model = getClient().getGenerativeModel({
            model: GEMINI_MODEL,
            safetySettings: SAFETY_SETTINGS,
        });

        const result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: OCR_SYSTEM_PROMPT },
                        {
                            inlineData: {
                                mimeType,
                                data: base64ImageData,
                            },
                        },
                    ],
                },
            ],
            generationConfig: {
                temperature: 0.1, // Low temp → faithful extraction
                maxOutputTokens: 4096,
            },
        });

        return extractText(result, "OCR_FAILED");
    } catch (error) {
        if (error instanceof GeminiServiceError) throw error;

        throw new GeminiServiceError(
            `OCR extraction failed: ${error instanceof Error ? error.message : String(error)}`,
            "NETWORK_ERROR",
            error
        );
    }
}

// ─────────────────────────────────────────────────────────────

/**
 * Generates analogy-based explanations of the extracted notes,
 * tailored to the student's major.
 *
 * @param extractedText  Text previously extracted via `extractTextFromImage`.
 * @param userMajor      The student's major / field (e.g., "History").
 * @returns              Markdown-formatted analogy explanations.
 *
 * @throws {GeminiServiceError}
 *
 * @example
 * ```ts
 * const analogies = await generateAnalogies(ocrText, "Biology");
 * ```
 */
export async function generateAnalogies(
    extractedText: string,
    userMajor: string
): Promise<string> {
    if (!extractedText.trim()) {
        throw new GeminiServiceError(
            "Cannot generate analogies from empty text.",
            "ANALOGY_FAILED"
        );
    }

    if (!userMajor.trim()) {
        throw new GeminiServiceError(
            "A student major is required to generate analogies.",
            "ANALOGY_FAILED"
        );
    }

    try {
        const model = getClient().getGenerativeModel({
            model: GEMINI_MODEL,
            safetySettings: SAFETY_SETTINGS,
        });

        const prompt = buildAnalogyPrompt({ userMajor, extractedText });

        const result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [{ text: prompt }],
                },
            ],
            generationConfig: {
                temperature: 0.7, // Higher temp → creative analogies
                maxOutputTokens: 8192,
            },
        });

        return extractText(result, "ANALOGY_FAILED");
    } catch (error) {
        if (error instanceof GeminiServiceError) throw error;

        throw new GeminiServiceError(
            `Analogy generation failed: ${error instanceof Error ? error.message : String(error)}`,
            "NETWORK_ERROR",
            error
        );
    }
}

// ─────────────────────────────────────────────────────────────

/**
 * Convenience function — runs both OCR and analogy generation
 * in a single call (scan → extract → explain).
 *
 * @param base64ImageData  Base64 image of the scanned note.
 * @param userMajor        Student's major.
 * @param mimeType         Image MIME type.
 * @returns                `{ extractedText, analogies }`
 */
export async function scanAndExplain(
    base64ImageData: string,
    userMajor: string,
    mimeType: "image/jpeg" | "image/png" | "image/webp" = "image/jpeg"
): Promise<{ extractedText: string; analogies: string }> {
    const extractedText = await extractTextFromImage(base64ImageData, mimeType);
    const analogies = await generateAnalogies(extractedText, userMajor);
    return { extractedText, analogies };
}
