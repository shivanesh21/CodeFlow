import * as geminiService from "../services/geminiService.js";
import StudentConceptPerformance from "../models/StudentConceptPerformance.js";
import { CONCEPT_DISPLAY_NAMES } from "../utils/concepts.js";

// ============================================================
// Supported languages & actions for validation
// ============================================================
const SUPPORTED_LANGUAGES = new Set([
  "javascript",
  "python",
  "java",
  "cpp",
  "c",
  "typescript",
  "go",
  "rust",
  "ruby",
  "php",
  "swift",
  "kotlin",
  "csharp",
]);

const SUPPORTED_ACTIONS = new Set([
  "chat",
  "explain",
  "explainLineByLine",
  "findErrors",
  "fixCode",
  "refactor",
  "complexity",
  "explainConcepts",
  "generateExample",
  "explainDataStructure",
  "explainAlgorithm",
  "explainSelection",
]);

const MAX_CODE_LENGTH = 50_000; // ~50 KB
const MAX_MESSAGE_LENGTH = 5_000;
const MAX_HISTORY_LENGTH = 50;

// ============================================================
// Simple in-memory per-user rate limiter
// ============================================================
const rateLimitMap = new Map();
const RATE_WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20;

function checkRateLimit(identifier) {
  const now = Date.now();
  let entry = rateLimitMap.get(identifier);

  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    entry = { windowStart: now, count: 1 };
    rateLimitMap.set(identifier, entry);
    return true;
  }

  entry.count += 1;
  return entry.count <= MAX_REQUESTS_PER_WINDOW;
}

// Periodically clean stale rate-limit entries (every 5 min)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now - entry.windowStart > RATE_WINDOW_MS * 2) {
      rateLimitMap.delete(key);
    }
  }
}, 300_000);

// ============================================================
// POST /api/ai/chat
// ============================================================
export const chat = async (req, res) => {
  try {
    const {
      message = "",
      code = "",
      language = "javascript",
      action = "chat",
      selectedCode = "",
      error: codeError = "",
      output: codeOutput = "",
      conversationHistory = [],
      explanationLevel = "intermediate",
    } = req.body;

    // ------ Rate-limit ------
    const userId = req.user?._id?.toString() || req.ip || "anonymous";
    if (!checkRateLimit(userId)) {
      return res.status(429).json({
        success: false,
        message:
          "You are sending requests too quickly. Please wait a minute and try again.",
      });
    }

    // ------ Validation ------
    if (!message && action === "chat") {
      return res.status(400).json({
        success: false,
        message: "A message is required for chat.",
      });
    }

    if (
      action !== "chat" &&
      !code.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Code is required for this action.",
      });
    }

    if (code.length > MAX_CODE_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Code is too large (${Math.round(code.length / 1024)} KB). Maximum is ${Math.round(MAX_CODE_LENGTH / 1024)} KB.`,
      });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        success: false,
        message: "Message is too long. Please shorten your question.",
      });
    }

    if (!SUPPORTED_ACTIONS.has(action)) {
      return res.status(400).json({
        success: false,
        message: `Unsupported action: '${action}'.`,
      });
    }

    if (language && !SUPPORTED_LANGUAGES.has(language.toLowerCase())) {
      // Not a hard block — just warn, Gemini can still try
      console.warn(`AI request for unsupported language: ${language}`);
    }

    if (conversationHistory.length > MAX_HISTORY_LENGTH) {
      return res.status(400).json({
        success: false,
        message: "Conversation history is too long. Please start a new chat.",
      });
    }

    // ------ Call Gemini ------
    const result = await geminiService.chat({
      message,
      code,
      language: language.toLowerCase(),
      action,
      selectedCode,
      error: codeError,
      output: codeOutput,
      conversationHistory,
      explanationLevel,
    });

    if (!result.success) {
      return res.status(502).json(result);
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error("AI Controller Error:", err);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred. Please try again later.",
    });
  }
};

// ============================================================
// POST /api/ai/analyze-performance
// Fetch user's concept performance → send to Gemini → return
// personalized learning recommendations.
// ============================================================
export const analyzePerformance = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch all concept performance records for this user
    const records = await StudentConceptPerformance.find({ userId }).lean();

    // Enrich with display names
    const performances = records.map((r) => ({
      concept: r.concept,
      displayName: CONCEPT_DISPLAY_NAMES[r.concept] || r.concept,
      accuracy: r.accuracy,
      masteryLevel: r.masteryLevel,
      totalAttempts: r.totalAttempts,
      correctAnswers: r.correctAnswers,
      trend: r.trend,
    }));

    const totalAttempts = records.reduce((s, r) => s + r.totalAttempts, 0);
    const totalCorrect = records.reduce((s, r) => s + r.correctAnswers, 0);
    const overallAccuracy =
      totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

    const result = await geminiService.analyzePerformance({
      performances,
      summary: {
        overallAccuracy,
        totalConceptsAttempted: records.length,
      },
      studentName: req.user.name || "Student",
    });

    if (!result.success) {
      return res.status(502).json(result);
    }

    return res.status(200).json({
      success: true,
      analysis: result.parsed,
      rawText: result.raw,
    });
  } catch (err) {
    console.error("analyzePerformance error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error generating learning analysis.",
    });
  }
};
