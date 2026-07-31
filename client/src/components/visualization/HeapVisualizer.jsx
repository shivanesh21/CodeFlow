import React from "react";
import { useVisualizer } from "../../context/VisualizerContext";
import "./visualization.css";

export default function HeapVisualizer() {
  const { currentSnapshot } = useVisualizer();

  if (!currentSnapshot) {
    return (
      <div className="viz-empty">
        <span>🧠</span>
        <p>Heap is empty. Objects and arrays appear here when allocated.</p>
      </div>
    );
  }

  const heap = currentSnapshot.heap || [];
  const objects = currentSnapshot.objects || {};
  const arrays = currentSnapshot.arrays || {};

  const hasContent = heap.length > 0 || Object.keys(objects).length > 0 || Object.keys(arrays).length > 0;

  if (!hasContent) {
    return (
      <div className="viz-empty">
        <span>🧠</span>
        <p>No heap allocations at this step. Try declaring objects or arrays.</p>
      </div>
    );
  }

  return (
    <div className="heap-panel">
      {Object.entries(objects).map(([key, obj]) => (
        <div key={key} className="heap-object-card">
          <div className="heap-card-header">
            <span className="heap-obj-name">{key}</span>
            <span className="heap-type-badge">Object</span>
          </div>
          {Object.entries(obj).map(([prop, val]) => (
            <div key={prop} className="heap-prop-row">
              <span className="heap-prop-key">{prop}:</span>
              <span className="heap-prop-val">{JSON.stringify(val)}</span>
            </div>
          ))}
        </div>
      ))}

      {Object.entries(arrays).map(([key, arr]) => (
        <div key={key} className="heap-object-card">
          <div className="heap-card-header">
            <span className="heap-obj-name">{key}</span>
            <span className="heap-type-badge array">Array[{arr.length}]</span>
          </div>
          <div className="heap-array-boxes">
            {arr.map((item, i) => (
              <div key={i} className="heap-array-cell">
                <div className="cell-idx">[{i}]</div>
                <div className="cell-val">{JSON.stringify(item)}</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {heap.map((item, i) => (
        <div key={i} className="heap-object-card">
          <div className="heap-card-header">
            <span className="heap-obj-name">{item.addr}</span>
            <span className="heap-type-badge">{item.type}</span>
          </div>
          <pre className="heap-raw">{JSON.stringify(item.value, null, 2)}</pre>
        </div>
      ))}
    </div>
  );
}
