import React from "react";
import { useVisualizer } from "../../context/VisualizerContext";
import "./visualization.css";

export default function StackVisualizer() {
  const { currentSnapshot } = useVisualizer();

  if (!currentSnapshot) {
    return (
      <div className="viz-empty">
        <span>🗂</span>
        <p>No call stack yet. Run a visualization to see frames.</p>
      </div>
    );
  }

  const frames = currentSnapshot.callStack || [];

  return (
    <div className="stack-panel">
      <div className="stack-panel-inner">
        {frames.length === 0 ? (
          <div className="viz-empty"><p>Call stack is empty.</p></div>
        ) : (
          [...frames].reverse().map((frame, i) => (
            <div
              key={frame.id || i}
              className={`stack-frame ${i === 0 ? "active-frame" : ""}`}
            >
              <span className="frame-name">{frame.functionName}</span>
              <span className="frame-line">Line {frame.line}</span>
              <span className="frame-scope-badge">{frame.scope}</span>
            </div>
          ))
        )}
      </div>
      <div className="stack-base-label">── Stack Base (Global) ──</div>
    </div>
  );
}
