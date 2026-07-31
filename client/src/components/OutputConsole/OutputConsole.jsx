import React from "react";
import "./OutputConsole.css";

function OutputConsole({ output, error, loading, executionTime, onClear }) {
  return (
    <div className="output-console">
      <div className="console-header">
        <div className="header-left">
          <h3>Execution Output Console</h3>
          {executionTime !== null && executionTime !== undefined && (
            <span className="execution-time-tag">⏱️ {executionTime} ms</span>
          )}
        </div>
        <div className="header-right">
          {error ? (
            <span className="status-tag tag-error">Status: Error</span>
          ) : output ? (
            <span className="status-tag tag-success">Status: Success</span>
          ) : null}
          {onClear && (
            <button className="clear-console-btn" onClick={onClear}>
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="console-body">
        {loading ? (
          <div className="console-loading">
            <div className="console-spinner"></div>
            <span>Executing code on server...</span>
          </div>
        ) : error ? (
          <pre className="console-output error-text">{error}</pre>
        ) : (
          <pre className="console-output">
            {output || "Output will be printed here after running..."}
          </pre>
        )}
      </div>
    </div>
  );
}

export default OutputConsole;