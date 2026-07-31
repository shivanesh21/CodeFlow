import React from "react";
import { useVisualizer } from "../../context/VisualizerContext";
import "./visualization.css";

export default function ConsoleOutput() {
  const { currentSnapshot } = useVisualizer();

  const logs = currentSnapshot?.consoleOutput || [];

  return (
    <div className="console-window">
      {logs.length === 0 ? (
        <div className="console-placeholder">
          <span style={{ color: "var(--viz-text-muted)", fontStyle: "italic" }}>
            No output yet — console.log() statements will appear here.
          </span>
        </div>
      ) : (
        logs.map((line, i) => (
          <div key={i} className="console-line">
            <span className="console-prompt">&gt;</span>
            <span>{line}</span>
          </div>
        ))
      )}
    </div>
  );
}
