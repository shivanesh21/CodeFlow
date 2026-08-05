import React, { useState } from "react";
import { useVisualizer } from "../../context/VisualizerContext";
import { FaArrowDown, FaArrowUp, FaEye, FaLayerGroup, FaInfoCircle } from "react-icons/fa";
import "./visualization.css";

export default function DataStructureStackVisualizer() {
  const { currentSnapshot } = useVisualizer();
  const [customValue, setCustomValue] = useState("");
  const [interactiveStacks, setInteractiveStacks] = useState({});

  if (!currentSnapshot) {
    return (
      <div className="viz-empty">
        <span>🥞</span>
        <p>No Stack data available. Run a visualization to see Stack memory layout.</p>
      </div>
    );
  }

  // Extract arrays from snapshot
  const arraysFromSnapshot = currentSnapshot.arrays || {};
  const vars = currentSnapshot.variables || {};

  // Detect stack variables (names containing stack, stk, or arrays used as LIFO)
  const stackEntries = Object.entries(arraysFromSnapshot).filter(([name]) =>
    name.toLowerCase().includes("stack") || name.toLowerCase().includes("stk")
  );

  // If no variable explicitly named stack, include all arrays so user can view any array as a Stack
  const targetEntries = stackEntries.length > 0 ? stackEntries : Object.entries(arraysFromSnapshot);

  if (targetEntries.length === 0) {
    return (
      <div className="viz-empty">
        <span>🥞</span>
        <p>No Stack detected in current step. Declare a stack like <code>let stack = []</code> and call <code>stack.push(val)</code> / <code>stack.pop()</code>.</p>
      </div>
    );
  }

  return (
    <div className="ds-container stack-ds-container">
      <div className="ds-header-banner stack-banner">
        <div className="ds-title-group">
          <span className="ds-icon">🥞</span>
          <div>
            <h3>Stack Data Structure (LIFO)</h3>
            <p className="ds-subtitle">Last-In, First-Out linear structure. Push & Pop operations occur only at the TOP.</p>
          </div>
        </div>
        <div className="ds-concept-pill stack-pill">LIFO Principle</div>
      </div>

      {targetEntries.map(([stackName, snapshotItems]) => {
        const rawItems = interactiveStacks[stackName] || snapshotItems || [];
        const items = Array.isArray(rawItems) ? rawItems : [];
        const topIndex = items.length - 1;
        const topValue = topIndex >= 0 ? items[topIndex] : "Empty";
        const isMutated = currentSnapshot.mutatedVar === stackName;

        const handlePush = () => {
          const val = customValue.trim() !== "" ? (isNaN(customValue) ? customValue : Number(customValue)) : Math.floor(Math.random() * 90) + 10;
          setInteractiveStacks((prev) => ({
            ...prev,
            [stackName]: [...items, val],
          }));
          setCustomValue("");
        };

        const handlePop = () => {
          if (items.length === 0) return;
          setInteractiveStacks((prev) => ({
            ...prev,
            [stackName]: items.slice(0, -1),
          }));
        };

        return (
          <div key={stackName} className="ds-card stack-card">
            {/* Header & Meta */}
            <div className="ds-card-top">
              <div className="ds-var-badge">
                <span className="ds-var-name">{stackName}</span>
                <span className="ds-mem-addr">{vars[stackName]?.memoryAddr || "0x7FF08"}</span>
              </div>
              <div className="ds-stats-row">
                <div className="ds-stat"><span className="label">Size:</span> <strong>{items.length}</strong></div>
                <div className="ds-stat"><span className="label">Top Item:</span> <strong className="highlight-top">{JSON.stringify(topValue)}</strong></div>
              </div>
            </div>

            {/* Stack Visual Bucket Container */}
            <div className="stack-bucket-wrapper">
              <div className="stack-bucket-label">
                <FaArrowDown className="bounce-arrow" /> OPEN TOP (PUSH / POP ENTRY)
              </div>

              <div className="stack-bucket">
                {items.length === 0 ? (
                  <div className="empty-stack-placeholder">
                    <FaLayerGroup className="placeholder-icon" />
                    <p>Stack is empty</p>
                  </div>
                ) : (
                  [...items].reverse().map((item, reverseIdx) => {
                    const originalIdx = items.length - 1 - reverseIdx;
                    const isTop = originalIdx === topIndex;

                    return (
                      <div
                        key={originalIdx}
                        className={`stack-element-row ${isTop ? "top-element" : ""} ${isMutated && isTop ? "mutated-entry" : ""}`}
                      >
                        <div className="stack-pointer-indicator">
                          {isTop ? <span className="top-pointer-badge">👈 TOP [Idx {originalIdx}]</span> : <span className="idx-badge">Idx {originalIdx}</span>}
                        </div>
                        <div className="stack-element-box">
                          <span className="element-val">{JSON.stringify(item)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="stack-base">
                <span>🔒 STACK BASE</span>
              </div>
            </div>

            {/* Interactive Operations */}
            <div className="ds-interactive-bar">
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Enter item (e.g. 100)"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  className="ds-input"
                />
              </div>
              <div className="btn-group">
                <button onClick={handlePush} className="ds-action-btn push" title="Push item onto stack top">
                  <FaArrowDown /> Push (Top)
                </button>
                <button onClick={handlePop} className="ds-action-btn pop" disabled={items.length === 0} title="Pop item from stack top">
                  <FaArrowUp /> Pop (Top)
                </button>
                <button onClick={() => alert(`Top element is: ${JSON.stringify(topValue)}`)} className="ds-action-btn peek" disabled={items.length === 0} title="Peek top item">
                  <FaEye /> Peek
                </button>
              </div>
            </div>
          </div>
        );
      })}

      <div className="ds-explanation-footer stack-footer">
        <FaInfoCircle className="info-icon" />
        <span>
          <strong>LIFO Behavior:</strong> The element inserted last is the first to be retrieved (<code>Push = O(1)</code>, <code>Pop = O(1)</code>). Useful for Function Call Stack, Undo history, and Backtracking algorithms.
        </span>
      </div>
    </div>
  );
}
