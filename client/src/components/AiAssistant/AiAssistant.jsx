import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  sendDirectGeminiMessage,
  getStoredApiKey,
  setStoredApiKey,
  hasValidApiKey,
} from "../../services/geminiDirectService";
import "./AiAssistant.css";

// ============================================================
// Quick Action Definitions
// ============================================================
const QUICK_ACTIONS = [
  { id: "explain", label: "💡 Explain", message: "Explain this code" },
  { id: "explainLineByLine", label: "📝 Line by Line", message: "Explain this code line by line" },
  { id: "findErrors", label: "🐛 Find Errors", message: "Find errors in this code" },
  { id: "fixCode", label: "🔧 Fix Code", message: "Fix the issues in this code" },
  { id: "refactor", label: "♻️ Refactor", message: "Refactor this code" },
  { id: "complexity", label: "📊 Complexity", message: "Analyze the time and space complexity" },
  { id: "explainConcepts", label: "🎓 Concepts", message: "Explain the programming concepts used" },
  { id: "generateExample", label: "📎 Example", message: "Generate a related example" },
  { id: "explainDataStructure", label: "🗂️ Data Struct", message: "Explain the data structures used" },
  { id: "explainAlgorithm", label: "⚙️ Algorithm", message: "Explain the algorithms used" },
];

// ============================================================
// Markdown code-block renderer with Copy & Apply buttons
// ============================================================
function CodeBlock({ children, className, onApplyCode }) {
  const [copied, setCopied] = useState(false);
  const lang = className?.replace("language-", "") || "";
  const codeText = String(children).replace(/\n$/, "");

  const handleCopy = () => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="ai-code-block-wrapper">
      <div className="ai-code-block-header">
        <span>{lang || "code"}</span>
        <div className="ai-code-block-actions">
          <button
            className={`ai-code-btn ${copied ? "copied" : ""}`}
            onClick={handleCopy}
          >
            {copied ? "✓ Copied" : "📋 Copy"}
          </button>
          {onApplyCode && (
            <button
              className="ai-code-btn"
              onClick={() => onApplyCode(codeText)}
              title="Replace editor code with this snippet"
            >
              ▶ Apply
            </button>
          )}
        </div>
      </div>
      <SyntaxHighlighter
        style={oneDark}
        language={lang || "text"}
        PreTag="pre"
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: "0.8rem",
          background: "#1e1e2e",
        }}
      >
        {codeText}
      </SyntaxHighlighter>
    </div>
  );
}

// ============================================================
// Single chat message renderer
// ============================================================
function ChatMessage({ msg, onApplyCode }) {
  const isUser = msg.role === "user";

  return (
    <div className={`ai-message ${msg.role}`}>
      <div className="ai-message-avatar">{isUser ? "U" : "AI"}</div>
      <div className="ai-message-content">
        {isUser ? (
          msg.content
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }) {
                if (!inline && className) {
                  return (
                    <CodeBlock
                      className={className}
                      onApplyCode={onApplyCode}
                    >
                      {children}
                    </CodeBlock>
                  );
                }
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {msg.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}

// ============================================================
// API Key Setup Screen
// ============================================================
function ApiKeySetup({ onKeySaved }) {
  const [inputKey, setInputKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = () => {
    const trimmed = inputKey.trim();
    if (!trimmed || trimmed.length < 15) {
      setError("Please enter a valid Gemini API key.");
      return;
    }
    setSaving(true);
    setStoredApiKey(trimmed);
    setTimeout(() => {
      setSaving(false);
      onKeySaved();
    }, 400);
  };

  return (
    <div className="ai-apikey-setup">
      <div className="ai-apikey-icon">🔑</div>
      <div className="ai-apikey-title">Connect Gemini AI</div>
      <div className="ai-apikey-subtitle">
        Enter your Google Gemini API key to enable the AI code assistant.
      </div>

      <div className="ai-apikey-steps">
        <div className="ai-apikey-step">
          <span className="ai-step-num">1</span>
          <span>
            Go to{" "}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
              className="ai-apikey-link"
            >
              aistudio.google.com/apikey
            </a>
          </span>
        </div>
        <div className="ai-apikey-step">
          <span className="ai-step-num">2</span>
          <span>Sign in with Google &amp; click <strong>Create API Key</strong></span>
        </div>
        <div className="ai-apikey-step">
          <span className="ai-step-num">3</span>
          <span>Copy the key (starts with <code>AIza...</code>) and paste below</span>
        </div>
      </div>

      <div className="ai-apikey-input-row">
        <input
          type={showKey ? "text" : "password"}
          className="ai-apikey-input"
          placeholder="AIzaSy..."
          value={inputKey}
          onChange={(e) => {
            setInputKey(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          autoFocus
        />
        <button
          className="ai-apikey-toggle"
          onClick={() => setShowKey((v) => !v)}
          title={showKey ? "Hide key" : "Show key"}
        >
          {showKey ? "🙈" : "👁️"}
        </button>
      </div>

      {error && <div className="ai-apikey-error">{error}</div>}

      <button
        className="ai-apikey-save-btn"
        onClick={handleSave}
        disabled={saving || !inputKey.trim()}
      >
        {saving ? "Saving…" : "✓ Save & Connect"}
      </button>

      <div className="ai-apikey-note">
        🔒 Your key is stored locally in your browser and never sent to our servers.
        The AI calls go directly to Google's Gemini API.
      </div>
    </div>
  );
}

// ============================================================
// Main AiAssistant Component
// ============================================================
export default function AiAssistant({
  code = "",
  language = "javascript",
  selectedCode = "",
  executionError = "",
  executionOutput = "",
  onApplyCode,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [explanationLevel, setExplanationLevel] = useState("intermediate");
  const [apiKeyConfigured, setApiKeyConfigured] = useState(hasValidApiKey());
  const [showKeySettings, setShowKeySettings] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Build conversation history (last 20 turns)
  const getHistory = useCallback(() => {
    const maxItems = 40;
    return messages.slice(-maxItems).map((m) => ({
      role: m.role,
      content: m.content,
    }));
  }, [messages]);

  // ---- Send a message/action to Gemini ----
  const sendMessage = useCallback(
    async (userMessage, action = "chat") => {
      if (loading) return;
      if (!userMessage.trim() && action === "chat") return;

      const userMsg = { role: "user", content: userMessage.trim() };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);

      try {
        const result = await sendDirectGeminiMessage({
          message: userMessage.trim(),
          code,
          language,
          action,
          selectedCode,
          error: executionError,
          output: executionOutput,
          conversationHistory: getHistory(),
          explanationLevel,
        });

        if (result.needsApiKey) {
          setApiKeyConfigured(false);
          setMessages((prev) => prev.slice(0, -1)); // remove user msg
          setLoading(false);
          return;
        }

        if (result.success) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: result.message },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `⚠️ ${result.message || "Something went wrong. Please try again."}`,
            },
          ]);
        }
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `⚠️ An unexpected error occurred. Please try again.`,
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [
      code,
      language,
      selectedCode,
      executionError,
      executionOutput,
      explanationLevel,
      loading,
      getHistory,
    ]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleQuickAction = (action) => {
    const def = QUICK_ACTIONS.find((a) => a.id === action);
    sendMessage(def?.message || action, action);
  };

  const handleSelectionAction = () => {
    if (!selectedCode) return;
    sendMessage("Explain the selected code", "explainSelection");
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = "38px";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const handleApiKeySaved = () => {
    setApiKeyConfigured(true);
    setShowKeySettings(false);
  };

  const handleChangeKey = () => {
    setShowKeySettings(true);
  };

  // ---- Show API Key Setup if not configured ----
  if (!apiKeyConfigured || showKeySettings) {
    return (
      <div className="ai-panel">
        <div className="ai-header">
          <div className="ai-header-left">
            <div className="ai-logo">✦</div>
            <span className="ai-header-title">CodeFlow AI</span>
          </div>
          {showKeySettings && (
            <div className="ai-header-actions">
              <button
                className="ai-header-btn"
                onClick={() => setShowKeySettings(false)}
                title="Back to chat"
              >
                ← Back
              </button>
            </div>
          )}
        </div>
        <ApiKeySetup onKeySaved={handleApiKeySaved} />
      </div>
    );
  }

  return (
    <div className="ai-panel">
      {/* ---- Header ---- */}
      <div className="ai-header">
        <div className="ai-header-left">
          <div className="ai-logo">✦</div>
          <span className="ai-header-title">CodeFlow AI</span>
          {loading && (
            <span className="ai-header-status">thinking…</span>
          )}
        </div>
        <div className="ai-header-actions">
          <button
            className="ai-header-btn"
            onClick={handleChangeKey}
            title="Change API Key"
          >
            🔑
          </button>
          <button
            className="ai-header-btn"
            onClick={handleNewChat}
            title="New AI Chat"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* ---- Explanation Level ---- */}
      <div className="ai-level-bar">
        <span className="ai-level-label">Level:</span>
        {["beginner", "intermediate", "advanced"].map((lvl) => (
          <button
            key={lvl}
            className={`ai-level-btn ${explanationLevel === lvl ? "active" : ""}`}
            onClick={() => setExplanationLevel(lvl)}
          >
            {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
          </button>
        ))}
      </div>

      {/* ---- Quick Actions ---- */}
      <div className="ai-actions-bar">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.id}
            className="ai-action-btn"
            onClick={() => handleQuickAction(action.id)}
            disabled={loading || !code.trim()}
            title={action.message}
          >
            {action.label}
          </button>
        ))}
        {selectedCode && (
          <button
            className="ai-action-btn"
            onClick={handleSelectionAction}
            disabled={loading}
            title="Explain selected code"
          >
            🔍 Selection
          </button>
        )}
      </div>

      {/* ---- Messages ---- */}
      <div className="ai-messages">
        {messages.length === 0 && !loading ? (
          <div className="ai-empty-state">
            <div className="ai-empty-icon">✦</div>
            <div className="ai-empty-title">CodeFlow AI Assistant</div>
            <div className="ai-empty-subtitle">
              Write code in the editor, then click a quick action or ask a
              question below. I'll help you understand, debug, and improve
              your code.
            </div>
            <div className="ai-empty-badges">
              <span className="ai-badge">💡 Explain Code</span>
              <span className="ai-badge">🐛 Debug Errors</span>
              <span className="ai-badge">🎓 Learn Concepts</span>
              <span className="ai-badge">⚙️ Algorithms</span>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <ChatMessage
                key={idx}
                msg={msg}
                onApplyCode={onApplyCode}
              />
            ))}
            {loading && (
              <div className="ai-message assistant">
                <div className="ai-message-avatar">AI</div>
                <div className="ai-loading">
                  <div className="ai-loading-dots">
                    <div className="ai-loading-dot" />
                    <div className="ai-loading-dot" />
                    <div className="ai-loading-dot" />
                  </div>
                  <span className="ai-loading-text">
                    CodeFlow AI is thinking…
                  </span>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ---- Input Area ---- */}
      <form className="ai-input-area" onSubmit={handleSubmit}>
        <div className="ai-input-wrapper">
          <textarea
            ref={inputRef}
            className="ai-input"
            placeholder="Ask about your code… (e.g. What does this function do?)"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          className="ai-send-btn"
          disabled={loading || !input.trim()}
          title="Send message"
        >
          ➤
        </button>
      </form>
    </div>
  );
}
