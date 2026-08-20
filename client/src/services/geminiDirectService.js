import { GoogleGenerativeAI } from "@google/generative-ai";

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
// Action prompt builders
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
    `Analyze the time and space complexity of the following ${lang} code. For each significant operation or function, state the complexity with Big-O notation and explain **why** (e.g., nested loops → O(n2)).\n\n\`\`\`${lang}\n${code}\n\`\`\``,

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

function levelPreamble(level) {
  switch (level) {
    case "beginner":
      return "The user is a beginner — use simple language, avoid jargon, and give real-world analogies where helpful.\n\n";
    case "advanced":
      return "The user is advanced — discuss implementation details, trade-offs, optimization opportunities, and edge cases.\n\n";
    default:
      return "";
  }
}

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

  if (action && action !== "chat" && ACTION_PROMPTS[action]) {
    if (action === "explainSelection" && selectedCode) {
      prompt += ACTION_PROMPTS[action](code, language, selectedCode);
    } else {
      prompt += ACTION_PROMPTS[action](code, language);
    }
    if (message) {
      prompt += `\n\nAdditional user question: ${message}`;
    }
  } else {
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
// API Key Management (stored in localStorage)
// ============================================================
export function getStoredApiKey() {
  return (
    localStorage.getItem("codeflow_gemini_api_key") ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    ""
  );
}

export function setStoredApiKey(key) {
  if (key && key.trim()) {
    localStorage.setItem("codeflow_gemini_api_key", key.trim());
  } else {
    localStorage.removeItem("codeflow_gemini_api_key");
  }
}

export function hasValidApiKey() {
  const key = getStoredApiKey();
  return (
    key &&
    key.length > 10 &&
    !key.includes("YOUR_GEMINI_API_KEY_HERE") &&
    key !== ""
  );
}

// ============================================================
// Direct Gemini API call from the browser
// ============================================================
export async function sendDirectGeminiMessage(payload) {
  const apiKey = getStoredApiKey();

  if (!hasValidApiKey()) {
    return {
      success: false,
      needsApiKey: true,
      message: "Please enter your Gemini API key to use the AI assistant.",
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    const userPrompt = buildPrompt(payload);

    // Map conversation history to Gemini format
    const history = (payload.conversationHistory || [])
      .slice(-40)
      .map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

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
    console.error("Direct Gemini Error:", err);
    const msg = (err?.message || "").toLowerCase();

    if (
      msg.includes("api key") ||
      msg.includes("api_key") ||
      err?.status === 400
    ) {
      return {
        success: false,
        needsApiKey: true,
        message:
          "Invalid API key. Please check your Gemini API key and try again.",
      };
    }
    if (
      msg.includes("quota") ||
      msg.includes("rate limit") ||
      err?.status === 429
    ) {
      return {
        success: false,
        message: "Rate limit reached. Please wait a moment before trying again.",
      };
    }

    return {
      success: false,
      message:
        "An error occurred communicating with Gemini AI. Please try again.",
    };
  }
}
