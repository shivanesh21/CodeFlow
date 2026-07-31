import React from "react";
import { useVisualizer } from "../../context/VisualizerContext";
import "./visualization.css";

export default function VariableTable() {
  const { currentSnapshot } = useVisualizer();

  if (!currentSnapshot) {
    return (
      <div className="viz-empty">
        <span>📦</span>
        <p>No variables declared yet. Click <strong>Visualize</strong> to start.</p>
      </div>
    );
  }

  const variables = currentSnapshot.variables || {};
  const entries = Object.values(variables);

  if (entries.length === 0) {
    return (
      <div className="viz-empty">
        <span>📦</span>
        <p>No variables in scope at this step.</p>
      </div>
    );
  }

  return (
    <div className="variable-table-panel">
      {entries.map((v) => (
        <div
          key={v.name}
          className={`variable-card ${v.name === currentSnapshot.mutatedVar ? "mutated" : ""}`}
        >
          <div className="variable-card-header">
            <span className="var-name">{v.name}</span>
            <span className="var-type">{v.type}</span>
          </div>
          <div className="var-val-box">
            {JSON.stringify(v.value)}
          </div>
          <div className="var-meta-row">
            <span className="var-memory-addr">{v.memoryAddr || "—"}</span>
            <span className="var-kind-badge">{v.kind}</span>
            {v.isMutated && <span className="var-mutated-flag">✏️ mutated</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
