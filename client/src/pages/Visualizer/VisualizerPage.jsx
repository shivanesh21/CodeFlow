import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { VisualizerProvider, useVisualizer } from "../../context/VisualizerContext";
import TopToolbar from "../../components/visualization/TopToolbar";
import VariableTable from "../../components/visualization/VariableTable";
import ArrayVisualizer from "../../components/visualization/ArrayVisualizer";
import DataStructureStackVisualizer from "../../components/visualization/DataStructureStackVisualizer";
import QueueVisualizer from "../../components/visualization/QueueVisualizer";
import StackVisualizer from "../../components/visualization/StackVisualizer";
import HeapVisualizer from "../../components/visualization/HeapVisualizer";
import ConsoleOutput from "../../components/visualization/ConsoleOutput";
import Timeline from "../../components/visualization/Timeline";
import CodeViewer from "../../components/visualization/CodeViewer";
import "./VisualizerPage.css";

/* ──────────────────────────────────────────────────────────────
   Inner canvas that consumes VisualizerContext
────────────────────────────────────────────────────────────── */
function VisualizerCanvas({ initialCode, initialLanguage }) {
  const {
    setCode,
    setLanguage,
    visualizeCode,
    visualizerTheme,
    activeTab,
    setActiveTab,
    currentSnapshot,
    snapshots,
    currentStepIndex,
  } = useVisualizer();

  const navigate = useNavigate();

  /* Inject code from Editor on first mount */
  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
    }
    if (initialLanguage) {
      setLanguage(initialLanguage);
    }
  }, []); // eslint-disable-line

  /* Auto-visualize when injected code is ready */
  useEffect(() => {
    if (initialCode) {
      const timer = setTimeout(() => visualizeCode(), 300);
      return () => clearTimeout(timer);
    }
  }, []); // eslint-disable-line

  /* Auto-switch tab based on current step's concept type */
  useEffect(() => {
    if (currentSnapshot?.conceptType) {
      const type = currentSnapshot.conceptType.toUpperCase();
      if (type.includes("STACK")) {
        setActiveTab("dsStack");
      } else if (type.includes("QUEUE")) {
        setActiveTab("queue");
      } else if (type.includes("ARRAY")) {
        setActiveTab("array");
      }
    }
  }, [currentSnapshot, currentStepIndex]); // eslint-disable-line

  const TABS = [
    { id: "array",     label: "🔢 Array" },
    { id: "dsStack",   label: "🥞 Stack (LIFO)" },
    { id: "queue",     label: "📬 Queue (FIFO)" },
    { id: "variables", label: "📦 Variables" },
    { id: "stack",     label: "🗂 Call Stack" },
    { id: "heap",      label: "🧠 Heap Memory" },
    { id: "console",   label: "💻 Console" },
  ];

  return (
    <div className={`visualizer-page ${visualizerTheme}`}>
      {/* Header bar */}
      <header className="viz-page-header">
        <div className="viz-page-title">
          <span className="viz-logo">⚡</span>
          <h1>Code Visualizer</h1>
          <span className="viz-badge">Array • Stack • Queue Execution</span>
        </div>
        <button
          className="viz-back-btn"
          onClick={() => navigate("/editor")}
          title="Return to Editor"
        >
          ← Back to Editor
        </button>
      </header>

      {/* Toolbar with language / level / playback controls */}
      <TopToolbar />

      {/* Main content split */}
      <div className="viz-body">
        {/* LEFT: code viewer with line highlight */}
        <aside className="viz-code-panel">
          <div className="viz-panel-label">📄 Source Code</div>
          <CodeViewer />
        </aside>

        {/* RIGHT: tabbed panels */}
        <section className="viz-detail-panel">
          {/* Step explanation */}
          {currentSnapshot && (
            <div className="explanation-box">
              <div className="explanation-title">
                <span>🔍</span>
                Step {currentStepIndex + 1} / {snapshots.length} — {currentSnapshot.conceptType}
              </div>
              <p>{currentSnapshot.explanation}</p>
            </div>
          )}

          {/* Tab navigation */}
          <nav className="viz-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`viz-tab-btn ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Tab content */}
          <div className="viz-tab-content">
            {activeTab === "array"     && <ArrayVisualizer />}
            {activeTab === "dsStack"   && <DataStructureStackVisualizer />}
            {activeTab === "queue"     && <QueueVisualizer />}
            {activeTab === "variables" && <VariableTable />}
            {activeTab === "stack"     && <StackVisualizer />}
            {activeTab === "heap"      && <HeapVisualizer />}
            {activeTab === "console"   && <ConsoleOutput />}
          </div>
        </section>
      </div>

      {/* Bottom timeline scrubber */}
      <footer className="viz-footer">
        <Timeline />
      </footer>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Page wrapper – wraps canvas in VisualizerProvider
────────────────────────────────────────────────────────────── */
export default function VisualizerPage() {
  const location = useLocation();
  const initialCode     = location.state?.code     || null;
  const initialLanguage = location.state?.language || null;

  return (
    <VisualizerProvider>
      <VisualizerCanvas initialCode={initialCode} initialLanguage={initialLanguage} />
    </VisualizerProvider>
  );
}
