import React, { useRef, useEffect } from "react";
import { useVisualizer } from "../../context/VisualizerContext";
import "./visualization.css";

export default function CodeViewer() {
  const { code, currentSnapshot } = useVisualizer();
  const activeLineRef = useRef(null);

  const currentLine = currentSnapshot?.currentLine || null;
  const lines = code ? code.split("\n") : [];

  // Auto-scroll highlighted line into view
  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentLine]);

  return (
    <div className="code-viewer">
      <pre className="code-viewer-pre">
        {lines.map((line, idx) => {
          const lineNum = idx + 1;
          const isActive = lineNum === currentLine;
          return (
            <div
              key={lineNum}
              ref={isActive ? activeLineRef : null}
              className={`code-line ${isActive ? "active-line" : ""}`}
            >
              <span className="line-num">{lineNum}</span>
              <span className="line-content">{line || " "}</span>
            </div>
          );
        })}
      </pre>
    </div>
  );
}
