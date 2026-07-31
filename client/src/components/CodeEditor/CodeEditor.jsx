import React from "react";
import Editor from "@monaco-editor/react";
import { useTheme } from "../../context/ThemeContext";
import "./CodeEditor.css";

function CodeEditor({
  language,
  code,
  setCode,
  fontSize = 16,
  showLineNumbers = true,
  onRun,
  onSave,
}) {
  const { theme } = useTheme();

  const handleEditorMount = (editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (onRun) onRun();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (onSave) onSave();
    });
  };

  return (
    <div className="editor-container">
      <Editor
        height="500px"
        language={language === "cpp" ? "cpp" : language}
        value={code}
        theme={theme === "dark" ? "vs-dark" : "light"}
        onChange={(value) => setCode(value || "")}
        onMount={handleEditorMount}
        options={{
          fontSize: Number(fontSize),
          lineNumbers: showLineNumbers ? "on" : "off",
          minimap: { enabled: false },
          automaticLayout: true,
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          padding: { top: 12 },
        }}
      />
    </div>
  );
}

export default CodeEditor;