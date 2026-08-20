import { GoogleGenerativeAI } from "@google/generative-ai";

// ============================================================
// Gemini Service — Reusable AI service for CodeFlow
// ============================================================

let genAI = null;

/**
 * Lazily initialise the Google GenAI client.
 * Reuses the same client across all requests.
 */
function getClient() {
  if (!genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not configured on the server.");
    }
    genAI = new GoogleGenerativeAI(key);
  }
  return genAI;
}

// ============================================================
// System instruction — shapes Gemini into a programming tutor
// ============================================================
const SYSTEM_INSTRUCTION = `You are **CodeFlow AI**, an interactive programming tutor built into the CodeFlow code editor.

Your primary goal is to **help users understand their code**, not just give answers.

## Behaviour rules
- Explain concepts clearly and concisely.
- Adapt your language to the user's apparent skill level.
- Prefer **teaching** over simply providing code.
- Explain **why** something works, not just what it does.
- Use the user's current code as the primary context for every answer.
- Never invent behaviour that the code does not exhibit.
- If you are uncertain, say so explicitly.
- Point out mistakes accurately; do not claim errors exist when the code is correct.
- Use examples when they aid understanding.
- Structure answers with headings, bullet points, and code blocks.
- Avoid unnecessary verbosity — be thorough yet concise.
- Encourage understanding rather than copy-pasting code.
- When providing code suggestions, always explain what changed and why.
- Use Markdown formatting for all responses.
- Wrap code in fenced code blocks with the correct language identifier.

## When explaining code
1. Identify the code's purpose.
2. List important variables, functions, and data structures.
3. Describe the control flow and execution order.
4. Highlight programming concepts.
5. Note potential issues or improvements.
6. State time/space complexity when relevant.

## When debugging
- Identify the type of error (syntax, logic, runtime, type, etc.).
- Explain *why* the error occurs.
- Suggest a concrete fix with a corrected code block.

## When refactoring
- Point out readability, naming, duplication, and structure issues.
- Provide refactored code with clear explanations.

## Formatting
- Use Markdown headings, numbered/bulleted lists, bold, inline code.
- Wrap code in fenced code blocks (\`\`\`language ... \`\`\`).
- Keep explanations structured and scannable.`;

// ============================================================
// Build the user prompt depending on the requested action
// ============================================================
const ACTION_PROMPTS = {
  explain: (code, lang) =>
    `Explain the following ${lang} code. Describe what it does, its purpose, important variables, functions, control flow, data structures, programming concepts, expected output, potential issues, and time/space complexity where applicable.\n\n\`\`\`${lang}\n${code}\n\`\`\``,

  explainLineByLine: (code, lang) =>
    `Explain the following ${lang} code line by line (or by logical block if the code is long). For each line/block state what it does and why.\n\n\`\`\`${lang}\n${code}\n\`\`\``,

  findErrors: (code, lang) =>
    `Analyze the following ${lang} code for errors — syntax errors, logical errors, runtime risks, incorrect API usage, type problems, and common mistakes. For each issue provide: **Problem**, **Why it happens**, **Suggested fix**, and a **Corrected code** block. If the code appears correct, say so.\n\n\`\`\`${lang}\n${code}\n\`\`\``,

  fixCode: (code, lang) =>
    `The following ${lang} code may have issues. Identify every problem, explain each one, then provide a single corrected version of the full code with comments explaining what changed.\n\n\`\`\`${lang}\n${code}\n\`\`\``,

  refactor: (code, lang) =>
    `Refactor the following ${lang} code. Analyze readability, naming, duplication, structure, unnecessary complexity, maintainability, and performance. Then provide:\n1. Current approach summary\n2. Problems identified\n3. Refactored code\n4. Explanation of every change\n\n\`\`\`${lang}\n${code}\n\`\`\``,

  complexity: (code, lang) =>
    `Analyze the time and space complexity of the following ${lang} code. For each significant operation or function, state the complexity with Big-O notation and explain **why** (e.g., nested loops → O(n²)).\n\n\`\`\`${lang}\n${code}\n\`\`\``,

  explainConcepts: (code, lang) =>
    `Identify every programming concept present in the following ${lang} code (e.g., arrays, loops, recursion, closures, OOP, etc.). List each concept and explain it in the context of this code.\n\n\`\`\`${lang}\n${code}\n\`\`\``,

  generateExample: (code, lang) =>
    `Based on the following ${lang} code, generate a related but different example that uses similar concepts. Explain the example clearly.\n\n\`\`\`${lang}\n${code}\n\`\`\``,

  explainDataStructure: (code, lang) =>
    `Identify the data structures used in the following ${lang} code. For each one explain: what it is, how it works, the operations being performed, their time complexity, why the data structure is used, and how this code implements it.\n\n\`\`\`${lang}\n${code}\n\`\`\``,

  explainAlgorithm: (code, lang) =>
    `Identify any algorithms used in the following ${lang} code (e.g., searching, sorting, BFS, DFS, recursion, dynamic programming, greedy, etc.). For each algorithm explain: its name, purpose, step-by-step execution, time/space complexity, and key concepts.\n\n\`\`\`${lang}\n${code}\n\`\`\``,

  explainSelection: (code, lang, selectedCode) =>
    `The user has selected a portion of their ${lang} code and wants an explanation focused on the **selected portion**.\n\nFull code:\n\`\`\`${lang}\n${code}\n\`\`\`\n\nSelected code:\n\`\`\`${lang}\n${selectedCode}\n\`\`\`\n\nExplain the selected portion in context of the full program.`,
};

// ============================================================
// Build explanation-level preamble
// ============================================================
function levelPreamble(level) {
  switch (level) {
    case "beginner":
      return "The user is a beginner — use simple language, avoid jargon, and give real-world analogies where helpful.\n\n";
    case "advanced":
      return "The user is advanced — discuss implementation details, trade-offs, optimization opportunities, and edge cases.\n\n";
    case "intermediate":
    default:
      return "";
  }
}

// ============================================================
// Build the final prompt from the request payload
// ============================================================
function buildPrompt(payload) {
  const {
    action,
    code = "",
    language = "javascript",
    message = "",
    selectedCode = "",
    error: codeError = "",
    output: codeOutput = "",
    explanationLevel = "intermediate",
  } = payload;

  let prompt = levelPreamble(explanationLevel);

  // If there is a specific action, use the template
  if (action && action !== "chat" && ACTION_PROMPTS[action]) {
    if (action === "explainSelection" && selectedCode) {
      prompt += ACTION_PROMPTS[action](code, language, selectedCode);
    } else {
      prompt += ACTION_PROMPTS[action](code, language);
    }

    // Append the user's additional message if any
    if (message) {
      prompt += `\n\nAdditional user question: ${message}`;
    }
  } else {
    // Free-form chat — include code context
    if (code) {
      prompt += `Current ${language} code in the editor:\n\`\`\`${language}\n${code}\n\`\`\`\n\n`;
    }
    if (selectedCode) {
      prompt += `User-selected portion:\n\`\`\`${language}\n${selectedCode}\n\`\`\`\n\n`;
    }
    if (codeError) {
      prompt += `Execution error:\n\`\`\`\n${codeError}\n\`\`\`\n\n`;
    }
    if (codeOutput) {
      prompt += `Program output:\n\`\`\`\n${codeOutput}\n\`\`\`\n\n`;
    }
    prompt += message || "Help me with this code.";
  }

  return prompt;
}

// ============================================================
// Trim conversation history to avoid exceeding token limits
// Keep the most recent messages (max 20 turns = 40 items)
// ============================================================
const MAX_HISTORY_ITEMS = 40;

function trimHistory(history) {
  if (!Array.isArray(history) || history.length === 0) return [];

  // Only keep the last N items
  const trimmed =
    history.length > MAX_HISTORY_ITEMS
      ? history.slice(-MAX_HISTORY_ITEMS)
      : history;

  // Map to Gemini SDK format
  return trimmed.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));
}

// ============================================================
// Public API — send a prompt to Gemini and return the response
// ============================================================
export async function chat(payload) {
  try {
    const client = getClient();
    const userPrompt = buildPrompt(payload);
    const history = trimHistory(payload.conversationHistory);

    const model = client.getGenerativeModel({
      model: "gemini-3.6-flash", // Required model for new Google AI Studio API keys
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    const response = await model.generateContent({
      contents: [
        ...history,
        { role: "user", parts: [{ text: userPrompt }] },
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 4096,
      },
    });

    const text = response.response.text();

    if (!text) {
      return {
        success: false,
        message:
          "CodeFlow AI was unable to generate a response. Please try again.",
      };
    }

    return { success: true, message: text };
  } catch (err) {
    return handleGeminiError(err);
  }
}

// ============================================================
// Analyse student performance & return personalized learning path
// ============================================================
export async function analyzePerformance(performanceData) {
  try {
    const client = getClient();

    const {
      performances = [],
      summary = {},
      studentName = "the student",
    } = performanceData;

    // Build a readable performance snapshot for Gemini
    const conceptLines = performances
      .map(
        (p) =>
          `- ${p.displayName || p.concept}: accuracy=${p.accuracy}%, mastery=${p.masteryLevel}, attempts=${p.totalAttempts}, trend=${p.trend}`
      )
      .join("\n");

    const prompt = `You are an expert programming tutor and adaptive learning system for the CodeFlow platform.

A student named "${studentName}" has completed programming assessments. Here is their concept-level performance data:

${conceptLines || "No concept data yet."}

Overall accuracy: ${summary.overallAccuracy ?? "N/A"}%
Concepts attempted: ${summary.totalConceptsAttempted ?? 0} out of 19 total

Based on this data, provide a structured, personalized learning analysis in the following JSON format:

{
  "overallAssessment": "A 2-3 sentence overall assessment of the student's current level",
  "strengthSummary": "Brief description of what the student is good at",
  "weaknessSummary": "Brief description of the main knowledge gaps",
  "priorityWeakConcepts": [
    {
      "concept": "concept name",
      "reason": "why this needs attention",
      "suggestedAction": "specific thing the student should do"
    }
  ],
  "learningPath": [
    {
      "step": 1,
      "concept": "concept name",
      "action": "what to do",
      "resources": ["resource 1", "resource 2"],
      "estimatedTime": "e.g. 2 hours"
    }
  ],
  "encouragement": "A motivational message personalized to their progress",
  "nextAssessmentRecommendation": "Which topic/concept to assess next and why"
}

IMPORTANT: Return ONLY valid JSON. No markdown, no extra text outside the JSON object.`;

    const model = client.getGenerativeModel({
      model: "gemini-3.6-flash",
      systemInstruction:
        "You are an expert adaptive learning system for programming education. Always return valid JSON.",
    });

    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 2048,
      },
    });

    const rawText = response.response.text().trim();

    // Strip markdown fences if present
    const jsonText = rawText
      .replace(/^```(?:json)?\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      // If Gemini returned non-JSON, return raw text
      return {
        success: true,
        raw: rawText,
        parsed: null,
      };
    }

    return { success: true, parsed, raw: rawText };
  } catch (err) {
    return handleGeminiError(err);
  }
}

// ============================================================
// Centralised error handler
// ============================================================
function handleGeminiError(err) {
  console.error("Gemini API Error:", err?.message || err);

  const status = err?.status || err?.httpStatusCode || 0;
  const msg = (err?.message || "").toLowerCase();

  if (status === 429 || msg.includes("rate limit") || msg.includes("quota")) {
    return {
      success: false,
      message:
        "AI rate limit reached. Please wait a moment before trying again.",
    };
  }

  if (status === 401 || status === 403 || msg.includes("api key")) {
    return {
      success: false,
      message:
        "AI service authentication error. Please contact the administrator.",
    };
  }

  if (msg.includes("not found") || msg.includes("model")) {
    return {
      success: false,
      message:
        "The AI model is currently unavailable. Please try again later.",
    };
  }

  if (
    msg.includes("timeout") ||
    msg.includes("deadline") ||
    msg.includes("econnrefused")
  ) {
    return {
      success: false,
      message: "AI request timed out. Please try again.",
    };
  }

  return {
    success: false,
    message: "An unexpected AI error occurred. Please try again later.",
  };
}
