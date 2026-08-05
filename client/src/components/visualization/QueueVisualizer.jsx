import React, { useState } from "react";
import { useVisualizer } from "../../context/VisualizerContext";
import { FaSignOutAlt, FaSignInAlt, FaEye, FaInfoCircle } from "react-icons/fa";
import "./visualization.css";

export default function QueueVisualizer() {
  const { currentSnapshot } = useVisualizer();
  const [customValue, setCustomValue] = useState("");
  const [interactiveQueues, setInteractiveQueues] = useState({});

  if (!currentSnapshot) {
    return (
      <div className="viz-empty">
        <span>📬</span>
        <p>No Queue data available. Run a visualization to see Queue memory layout.</p>
      </div>
    );
  }

  const arraysFromSnapshot = currentSnapshot.arrays || {};
  const vars = currentSnapshot.variables || {};

  // Detect queue variables (names containing queue, q, or arrays used as FIFO)
  const queueEntries = Object.entries(arraysFromSnapshot).filter(([name]) =>
    name.toLowerCase().includes("queue") || name.toLowerCase().includes("q")
  );

  // If no variable explicitly named queue, include all arrays
  const targetEntries = queueEntries.length > 0 ? queueEntries : Object.entries(arraysFromSnapshot);

  if (targetEntries.length === 0) {
    return (
      <div className="viz-empty">
        <span>📬</span>
        <p>No Queue detected in current step. Declare a queue like <code>let queue = []</code> and call <code>queue.push(val)</code> / <code>queue.shift()</code>.</p>
      </div>
    );
  }

  return (
    <div className="ds-container queue-ds-container">
      <div className="ds-header-banner queue-banner">
        <div className="ds-title-group">
          <span className="ds-icon">📬</span>
          <div>
            <h3>Queue Data Structure (FIFO)</h3>
            <p className="ds-subtitle">First-In, First-Out linear structure. Enqueue at REAR, Dequeue at FRONT.</p>
          </div>
        </div>
        <div className="ds-concept-pill queue-pill">FIFO Principle</div>
      </div>

      {targetEntries.map(([queueName, snapshotItems]) => {
        const rawItems = interactiveQueues[queueName] || snapshotItems || [];
        const items = Array.isArray(rawItems) ? rawItems : [];
        const frontIndex = 0;
        const rearIndex = items.length - 1;
        const frontValue = items.length > 0 ? items[frontIndex] : "Empty";
        const rearValue = items.length > 0 ? items[rearIndex] : "Empty";
        const isMutated = currentSnapshot.mutatedVar === queueName;

        const handleEnqueue = () => {
          const val = customValue.trim() !== "" ? (isNaN(customValue) ? customValue : Number(customValue)) : `Item #${Math.floor(Math.random() * 900) + 100}`;
          setInteractiveQueues((prev) => ({
            ...prev,
            [queueName]: [...items, val],
          }));
          setCustomValue("");
        };

        const handleDequeue = () => {
          if (items.length === 0) return;
          setInteractiveQueues((prev) => ({
            ...prev,
            [queueName]: items.slice(1),
          }));
        };

        return (
          <div key={queueName} className="ds-card queue-card">
            {/* Meta header */}
            <div className="ds-card-top">
              <div className="ds-var-badge">
                <span className="ds-var-name">{queueName}</span>
                <span className="ds-mem-addr">{vars[queueName]?.memoryAddr || "0x7FF12"}</span>
              </div>
              <div className="ds-stats-row">
                <div className="ds-stat"><span className="label">Size:</span> <strong>{items.length}</strong></div>
                <div className="ds-stat"><span className="label">Front:</span> <strong className="highlight-front">{JSON.stringify(frontValue)}</strong></div>
                <div className="ds-stat"><span className="label">Rear:</span> <strong className="highlight-rear">{JSON.stringify(rearValue)}</strong></div>
              </div>
            </div>

            {/* Queue Pipeline Visual Tube */}
            <div className="queue-pipeline-wrapper">
              {/* Dequeue Exit Indicator (LEFT) */}
              <div className="queue-gate exit-gate">
                <FaSignOutAlt className="gate-icon exit" />
                <span>EXIT (DEQUEUE / FRONT)</span>
              </div>

              {/* Items Line Tube */}
              <div className="queue-tube">
                {items.length === 0 ? (
                  <div className="empty-queue-placeholder">
                    <span>[ Queue is empty ]</span>
                  </div>
                ) : (
                  items.map((item, idx) => {
                    const isFront = idx === frontIndex;
                    const isRear = idx === rearIndex;

                    return (
                      <div
                        key={idx}
                        className={`queue-item-box ${isFront ? "front-item" : ""} ${isRear ? "rear-item" : ""} ${isMutated && isRear ? "mutated-enqueue" : ""}`}
                      >
                        <div className="queue-item-header">
                          <span className="idx-tag">[{idx}]</span>
                        </div>
                        <div className="queue-item-value">
                          <span>{JSON.stringify(item)}</span>
                        </div>
                        <div className="queue-item-footer">
                          {isFront && <span className="pointer-badge front-badge">👈 FRONT</span>}
                          {isRear && <span className="pointer-badge rear-badge">REAR 👉</span>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Enqueue Entry Indicator (RIGHT) */}
              <div className="queue-gate entry-gate">
                <FaSignInAlt className="gate-icon entry" />
                <span>ENTRY (ENQUEUE / REAR)</span>
              </div>
            </div>

            {/* Interactive controls */}
            <div className="ds-interactive-bar">
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Enter item value"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  className="ds-input"
                />
              </div>
              <div className="btn-group">
                <button onClick={handleEnqueue} className="ds-action-btn enqueue" title="Enqueue item at rear">
                  <FaSignInAlt /> Enqueue (Rear)
                </button>
                <button onClick={handleDequeue} className="ds-action-btn dequeue" disabled={items.length === 0} title="Dequeue item from front">
                  <FaSignOutAlt /> Dequeue (Front)
                </button>
                <button onClick={() => alert(`Front element is: ${JSON.stringify(frontValue)}`)} className="ds-action-btn peek" disabled={items.length === 0} title="Peek front item">
                  <FaEye /> Peek Front
                </button>
              </div>
            </div>
          </div>
        );
      })}

      <div className="ds-explanation-footer queue-footer">
        <FaInfoCircle className="info-icon" />
        <span>
          <strong>FIFO Behavior:</strong> The element inserted first is processed and removed first (<code>Enqueue = O(1)</code>, <code>Dequeue = O(1)</code>). Essential for Task scheduling, BFS graph traversal, and Message queues.
        </span>
      </div>
    </div>
  );
}
