import React, { useState } from "react";
import { useVisualizer } from "../../context/VisualizerContext";
import { FaPlus, FaMinus, FaArrowRight, FaArrowLeft, FaInfoCircle } from "react-icons/fa";
import "./visualization.css";

export default function ArrayVisualizer() {
  const { currentSnapshot } = useVisualizer();
  const [customValue, setCustomValue] = useState("");
  const [interactiveArrays, setInteractiveArrays] = useState({});

  if (!currentSnapshot) {
    return (
      <div className="viz-empty">
        <span>🔢</span>
        <p>No Array data available. Run a visualization to see Array memory layout.</p>
      </div>
    );
  }

  // Extract arrays from snapshot
  const arraysFromSnapshot = currentSnapshot.arrays || {};
  
  // Also check variables to find array references
  const vars = currentSnapshot.variables || {};
  const arrayVars = Object.entries(vars).filter(([_, meta]) => meta.type === "array");

  // Merge array sources
  const activeArrays = { ...arraysFromSnapshot };
  arrayVars.forEach(([name, meta]) => {
    if (!activeArrays[name] && Array.isArray(meta.value)) {
      activeArrays[name] = meta.value;
    }
  });

  const arrayKeys = Object.keys(activeArrays);

  if (arrayKeys.length === 0) {
    return (
      <div className="viz-empty">
        <span>🔢</span>
        <p>No Arrays allocated in current step. Declare an array like <code>let arr = [10, 20, 30]</code> to visualize.</p>
      </div>
    );
  }

  return (
    <div className="ds-container array-container">
      <div className="ds-header-banner">
        <div className="ds-title-group">
          <span className="ds-icon">🔢</span>
          <div>
            <h3>Array Visualizer (Contiguous Memory)</h3>
            <p className="ds-subtitle">Indexed elements stored sequentially in memory with O(1) random access.</p>
          </div>
        </div>
        <div className="ds-concept-pill">Indexed Access O(1)</div>
      </div>

      {arrayKeys.map((arrName) => {
        const rawItems = interactiveArrays[arrName] || activeArrays[arrName] || [];
        const items = Array.isArray(rawItems) ? rawItems : [];
        const isMutated = currentSnapshot.mutatedVar === arrName;
        const memoryAddress = vars[arrName]?.memoryAddr || "0x7FF00";

        const handleInteractivePush = () => {
          const val = customValue.trim() !== "" ? isNaN(customValue) ? customValue : Number(customValue) : Math.floor(Math.random() * 90) + 10;
          setInteractiveArrays((prev) => ({
            ...prev,
            [arrName]: [...items, val],
          }));
          setCustomValue("");
        };

        const handleInteractivePop = () => {
          if (items.length === 0) return;
          setInteractiveArrays((prev) => ({
            ...prev,
            [arrName]: items.slice(0, -1),
          }));
        };

        const handleInteractiveUnshift = () => {
          const val = customValue.trim() !== "" ? isNaN(customValue) ? customValue : Number(customValue) : Math.floor(Math.random() * 90) + 10;
          setInteractiveArrays((prev) => ({
            ...prev,
            [arrName]: [val, ...items],
          }));
          setCustomValue("");
        };

        const handleInteractiveShift = () => {
          if (items.length === 0) return;
          setInteractiveArrays((prev) => ({
            ...prev,
            [arrName]: items.slice(1),
          }));
        };

        return (
          <div key={arrName} className={`ds-card array-card ${isMutated ? "mutated-card" : ""}`}>
            {/* Top Info Bar */}
            <div className="ds-card-top">
              <div className="ds-var-badge">
                <span className="ds-var-name">{arrName}</span>
                <span className="ds-mem-addr">{memoryAddress}</span>
              </div>
              <div className="ds-stats-row">
                <div className="ds-stat"><span className="label">Length:</span> <strong>{items.length}</strong></div>
                <div className="ds-stat"><span className="label">Type:</span> <strong>Array</strong></div>
              </div>
            </div>

            {/* Visual Memory Blocks */}
            <div className="array-cells-wrapper">
              {items.length === 0 ? (
                <div className="empty-array-placeholder">
                  <span>[ Empty Array ]</span>
                </div>
              ) : (
                items.map((item, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === items.length - 1;

                  return (
                    <div
                      key={idx}
                      className={`array-cell-block ${isMutated && isLast ? "highlight-active" : ""}`}
                    >
                      {/* Cell Index Label */}
                      <div className="cell-header">
                        <span className="index-tag">Index [{idx}]</span>
                      </div>

                      {/* Cell Content */}
                      <div className="cell-content">
                        <span className="cell-value">{JSON.stringify(item)}</span>
                      </div>

                      {/* Cell Pointers */}
                      <div className="cell-footer">
                        {isFirst && <span className="pointer-tag head">Head</span>}
                        {isLast && <span className="pointer-tag tail">Tail</span>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Interactive Actions */}
            <div className="ds-interactive-bar">
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Enter value (e.g. 42)"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  className="ds-input"
                />
              </div>
              <div className="btn-group">
                <button onClick={handleInteractivePush} className="ds-action-btn push" title="Push to end">
                  <FaPlus /> Push (End)
                </button>
                <button onClick={handleInteractivePop} className="ds-action-btn pop" disabled={items.length === 0} title="Pop from end">
                  <FaMinus /> Pop (End)
                </button>
                <button onClick={handleInteractiveUnshift} className="ds-action-btn unshift" title="Unshift to front">
                  <FaArrowRight /> Unshift (Front)
                </button>
                <button onClick={handleInteractiveShift} className="ds-action-btn shift" disabled={items.length === 0} title="Shift from front">
                  <FaArrowLeft /> Shift (Front)
                </button>
              </div>
            </div>
          </div>
        );
      })}

      <div className="ds-explanation-footer">
        <FaInfoCircle className="info-icon" />
        <span>
          <strong>Array Characteristics:</strong> Contiguous memory allocation allows <code>O(1)</code> access by index. Insertion or deletion at arbitrary indices requires shifting elements (<code>O(N)</code>).
        </span>
      </div>
    </div>
  );
}
