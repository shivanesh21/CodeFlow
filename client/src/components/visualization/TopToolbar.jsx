import React from "react";
import { useVisualizer } from "../../context/VisualizerContext";
import { FaPlay, FaPause, FaStepForward, FaStepBackward, FaRedo, FaRocket, FaSun, FaMoon } from "react-icons/fa";
import { CONCEPT_PRESETS } from "../../utils/conceptPresets";
import "./TopToolbar.css";

function TopToolbar() {
  const {
    language,
    setLanguage,
    conceptLevel,
    setConceptLevel,
    loadPreset,
    visualizeCode,
    isPlaying,
    play,
    pause,
    nextStep,
    prevStep,
    restart,
    speed,
    setSpeed,
    currentStepIndex,
    snapshots,
    isAnalyzing,
    visualizerTheme,
    toggleVisualizerTheme,
  } = useVisualizer();

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    const nextLevel = CONCEPT_PRESETS[newLang]?.[conceptLevel] ? conceptLevel : "level1";
    loadPreset(newLang, nextLevel);
  };

  const handleConceptChange = (e) => {
    const newLevel = e.target.value;
    loadPreset(language, newLevel);
  };

  return (
    <div className="viz-toolbar">
      {/* Left controls: Selectors & Visualize Trigger */}
      <div className="toolbar-section left">
        <div className="control-group">
          <label htmlFor="language-select">Language:</label>
          <select
            id="language-select"
            value={language}
            onChange={handleLanguageChange}
            className="viz-select"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="c">C</option>
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="concept-select">Concept Level:</label>
          <select
            id="concept-select"
            value={conceptLevel}
            onChange={handleConceptChange}
            className="viz-select"
          >
            {Object.entries(CONCEPT_PRESETS[language] || {}).map(([level, preset]) => (
              <option key={level} value={level}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>

        <button
          className="viz-btn primary visualize-btn"
          onClick={visualizeCode}
          disabled={isAnalyzing}
        >
          <FaRocket /> {isAnalyzing ? "Analyzing..." : "Visualize"}
        </button>
      </div>

      {/* Center controls: Step Playback */}
      <div className="toolbar-section center">
        <button
          className="viz-btn icon-btn"
          onClick={restart}
          title="Restart Visualization"
          disabled={snapshots.length === 0}
        >
          <FaRedo />
        </button>

        <button
          className="viz-btn icon-btn"
          onClick={prevStep}
          title="Previous Step"
          disabled={currentStepIndex === 0 || snapshots.length === 0}
        >
          <FaStepBackward />
        </button>

        {isPlaying ? (
          <button className="viz-btn play-pause-btn" onClick={pause} title="Pause">
            <FaPause /> Pause
          </button>
        ) : (
          <button
            className="viz-btn play-pause-btn"
            onClick={play}
            title="Play"
            disabled={snapshots.length === 0}
          >
            <FaPlay /> Play
          </button>
        )}

        <button
          className="viz-btn icon-btn"
          onClick={nextStep}
          title="Next Step"
          disabled={currentStepIndex >= snapshots.length - 1 || snapshots.length === 0}
        >
          <FaStepForward />
        </button>

        <div className="step-counter">
          Step <span>{snapshots.length > 0 ? currentStepIndex + 1 : 0}</span> / {snapshots.length}
        </div>
      </div>

      {/* Right controls: Speed & Theme */}
      <div className="toolbar-section right">
        <div className="control-group speed-group">
          <label>Speed: {speed}x</label>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.5"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="speed-slider"
          />
        </div>

        <button
          className="viz-btn icon-btn theme-toggle"
          onClick={toggleVisualizerTheme}
          title="Toggle Theme"
        >
          {visualizerTheme === "dark" ? <FaSun /> : <FaMoon />}
        </button>
      </div>
    </div>
  );
}

export default TopToolbar;
