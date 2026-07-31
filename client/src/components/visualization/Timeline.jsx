import React from "react";
import { useVisualizer } from "../../context/VisualizerContext";
import "./visualization.css";

export default function Timeline() {
  const { snapshots, currentStepIndex, seekStep, currentSnapshot } = useVisualizer();

  const total = snapshots.length;

  const handleSeek = (e) => {
    seekStep(parseInt(e.target.value, 10));
  };

  return (
    <div className="timeline-container">
      <span className="timeline-label">
        Step <strong>{total > 0 ? currentStepIndex + 1 : 0}</strong> / {total}
      </span>

      <input
        type="range"
        className="timeline-slider"
        min={0}
        max={Math.max(total - 1, 0)}
        value={currentStepIndex}
        onChange={handleSeek}
        disabled={total === 0}
      />

      {currentSnapshot && (
        <span className="timeline-concept-badge">
          {currentSnapshot.conceptType}
        </span>
      )}
    </div>
  );
}
