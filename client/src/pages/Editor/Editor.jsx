import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import CodeEditor from "../../components/CodeEditor/CodeEditor";
import LanguageSelector from "../../components/LanguageSelector/LanguageSelector";
import RunButton from "../../components/RunButton/RunButton";
import OutputConsole from "../../components/OutputConsole/OutputConsole";
import { executeCode } from "../../services/executionService";
import { createSnippet } from "../../services/snippetService";
import { CODE_TEMPLATES } from "../../utils/codeTemplates";
import { useToast } from "../../context/ToastContext";
import "./Editor.css";

function Editor() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [language, setLanguage] = useState(
    location.state?.language || "javascript"
  );
  const [code, setCode] = useState(
    location.state?.code || CODE_TEMPLATES.javascript.defaultCode
  );
  const [stdin, setStdin] = useState("");
  const [output, setOutput] = useState("");
  const [errorText, setErrorText] = useState("");
  const [loading, setLoading] = useState(false);
  const [executionTime, setExecutionTime] = useState(null);

  // Customization controls
  const [fontSize, setFontSize] = useState(16);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [saveStatus, setSaveStatus] = useState("Saved");

  // File Upload Ref
  const fileInputRef = useRef(null);

  // Auto-Save Effect
  useEffect(() => {
    setSaveStatus("Saving...");
    const timeout = setTimeout(() => {
      localStorage.setItem(`codeflow_draft_${language}`, code);
      setSaveStatus("Saved");
    }, 1000);

    return () => clearTimeout(timeout);
  }, [code, language]);

  // Handle incoming code/language/autoRun from History or Snippets pages
  useEffect(() => {
    if (location.state) {
      if (location.state.language) setLanguage(location.state.language);
      if (location.state.code) setCode(location.state.code);
    }
  }, [location.state]);

  // Load template on language change unless state passed
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    const savedDraft = localStorage.getItem(`codeflow_draft_${newLang}`);
    if (savedDraft) {
      setCode(savedDraft);
    } else if (CODE_TEMPLATES[newLang]) {
      setCode(CODE_TEMPLATES[newLang].defaultCode);
    }
  };

  const handleRun = async () => {
    setLoading(true);
    setOutput("");
    setErrorText("");
    setExecutionTime(null);
    const startTime = performance.now();

    try {
      const result = await executeCode({
        language,
        code,
        input: stdin,
      });

      const execData = result.execution || result;

      const endTime = performance.now();
      const timeMs = Math.round(
        execData.executionTime !== undefined ? execData.executionTime : endTime - startTime
      );
      setExecutionTime(timeMs);

      if (execData.error && execData.status !== "success") {
        setErrorText(execData.error);
        setOutput(execData.output || "");
        addToast("Execution returned an error", "error");
      } else {
        setOutput(execData.output || (execData.error ? execData.error : "Program finished with no output."));
        if (execData.error) {
          setErrorText(execData.error);
        }
        addToast(`Code executed in ${timeMs} ms`, "success");
      }
    } catch (err) {
      setErrorText(err.response?.data?.message || "Execution Failed");
      addToast("Failed to connect to execution engine", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSnippet = async () => {
    const title = prompt("Enter a title for this snippet:", `Untitled ${language} Snippet`);
    if (!title) return;

    try {
      await createSnippet({
        title,
        language,
        code,
        description: "Saved from Monaco Playground",
      });
      addToast("Snippet saved to repository!", "success");
    } catch (err) {
      addToast("Failed to save snippet", "error");
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    addToast("Code copied to clipboard!", "info");
  };

  const handleDownloadCode = () => {
    const extMap = {
      javascript: "js",
      python: "py",
      java: "java",
      cpp: "cpp",
      c: "c",
    };
    const ext = extMap[language] || "txt";
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `main.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    addToast(`Downloaded main.${ext}`, "info");
  };

  const handleUploadFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      setCode(evt.target.result);
      addToast(`Uploaded ${file.name}`, "success");
    };
    reader.readAsText(file);
  };

  const handleResetCode = () => {
    if (window.confirm("Reset editor to default template? Unsaved changes will be lost.")) {
      if (CODE_TEMPLATES[language]) {
        setCode(CODE_TEMPLATES[language].defaultCode);
        addToast("Reset code template", "info");
      }
    }
  };

  return (
    <MainLayout>
      <div className="editor-page-container">
        {/* Toolbar Header */}
        <div className="editor-toolbar">
          <div className="toolbar-left">
            <LanguageSelector
              language={language}
              setLanguage={handleLanguageChange}
            />

            <div className="template-selector">
              <label>Template:</label>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="select-template"
              >
                {Object.entries(CODE_TEMPLATES).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="save-indicator" title="Auto-save status">
              <span
                className={`dot ${saveStatus === "Saved" ? "saved" : "saving"}`}
              ></span>
              <span className="save-text">{saveStatus}</span>
            </div>
          </div>

          <div className="toolbar-right">
            <RunButton onClick={handleRun} loading={loading} />
            <button
              className="btn-editor-action visualize-action"
              onClick={() =>
                navigate("/visualizer", { state: { code, language } })
              }
              title="Open Code Visualizer"
            >
              🔭 Visualize
            </button>
            <button
              className="btn-editor-action primary-action"
              onClick={handleSaveSnippet}
              title="Save to Snippets Repository (Ctrl+S)"
            >
              💾 Save
            </button>
          </div>
        </div>

        {/* Editor Settings & Quick Actions Bar */}
        <div className="editor-options-bar">
          <div className="options-group">
            <label>Font Size:</label>
            <select
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value)}
              className="opt-select"
            >
              <option value="12">12px</option>
              <option value="14">14px</option>
              <option value="16">16px</option>
              <option value="18">18px</option>
              <option value="20">20px</option>
            </select>

            <label className="checkbox-opt">
              <input
                type="checkbox"
                checked={showLineNumbers}
                onChange={(e) => setShowLineNumbers(e.target.checked)}
              />
              Line Numbers
            </label>
          </div>

          <div className="options-group">
            <button
              className="opt-btn"
              onClick={handleCopyCode}
              title="Copy Code"
            >
              📋 Copy
            </button>
            <button
              className="opt-btn"
              onClick={handleDownloadCode}
              title="Download Code File"
            >
              📥 Download
            </button>
            <button
              className="opt-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Upload File"
            >
              📤 Upload
            </button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleUploadFile}
            />
            <button
              className="opt-btn reset-btn"
              onClick={handleResetCode}
              title="Reset Code"
            >
              🔄 Reset
            </button>
          </div>
        </div>

        {/* Monaco Code Editor */}
        <CodeEditor
          language={language}
          code={code}
          setCode={setCode}
          fontSize={fontSize}
          showLineNumbers={showLineNumbers}
          onRun={handleRun}
          onSave={handleSaveSnippet}
        />

        {/* Output Console & STDIN */}
        <div className="console-split-wrapper">
          <div className="stdin-box">
            <div className="stdin-header">Standard Input (stdin)</div>
            <textarea
              rows="3"
              placeholder="Enter optional inputs for your program..."
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              className="stdin-textarea"
            ></textarea>
          </div>

          <div className="output-box">
            <OutputConsole
              output={output}
              error={errorText}
              loading={loading}
              executionTime={executionTime}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default Editor;