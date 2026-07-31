import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { generateJsSnapshots } from "../utils/jsTraceEngine";
import { CONCEPT_PRESETS } from "../utils/conceptPresets";
import axios from "axios";

const VisualizerContext = createContext();

export const VisualizerProvider = ({ children }) => {
  const [language, setLanguage] = useState("javascript");
  const [conceptLevel, setConceptLevel] = useState("level1");
  const [code, setCode] = useState(CONCEPT_PRESETS.javascript.level1.code);
  const [snapshots, setSnapshots] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // 1x, 2x, 0.5x multiplier
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [visualizerTheme, setVisualizerTheme] = useState("dark");
  const [activeTab, setActiveTab] = useState("variables"); // variables | stack | heap | console | timeline

  const playTimerRef = useRef(null);

  // Load preset whenever language or conceptLevel changes
  const loadPreset = (lang = language, level = conceptLevel) => {
    setLanguage(lang);
    setConceptLevel(level);
    if (CONCEPT_PRESETS[lang] && CONCEPT_PRESETS[lang][level]) {
      setCode(CONCEPT_PRESETS[lang][level].code);
    }
  };

  // Generate snapshots for code execution
  const visualizeCode = useCallback(async () => {
    setIsAnalyzing(true);
    setIsPlaying(false);
    setCurrentStepIndex(0);

    try {
      if (language === "javascript") {
        const jsSnaps = generateJsSnapshots(code);
        setSnapshots(jsSnaps);
      } else {
        // Multi-language backend execution service
        const response = await axios.post("/api/visualizer/trace", {
          code,
          language,
        });

        if (response.data && response.data.snapshots) {
          setSnapshots(response.data.snapshots);
        } else {
          // Fallback to JS engine trace
          setSnapshots(generateJsSnapshots(code));
        }
      }
    } catch (error) {
      console.warn("Backend trace service unavailable, utilizing client AST engine:", error);
      setSnapshots(generateJsSnapshots(code));
    } finally {
      setIsAnalyzing(false);
    }
  }, [code, language]);

  // Playback control functions
  const nextStep = useCallback(() => {
    setCurrentStepIndex((prev) => {
      if (prev < snapshots.length - 1) {
        return prev + 1;
      }
      setIsPlaying(false);
      return prev;
    });
  }, [snapshots.length]);

  const prevStep = useCallback(() => {
    setCurrentStepIndex((prev) => (prev > 0 ? prev - 1 : 0));
  }, []);

  const seekStep = useCallback(
    (stepIdx) => {
      if (stepIdx >= 0 && stepIdx < snapshots.length) {
        setCurrentStepIndex(stepIdx);
      }
    },
    [snapshots.length]
  );

  const play = useCallback(() => {
    if (snapshots.length === 0) return;
    if (currentStepIndex >= snapshots.length - 1) {
      setCurrentStepIndex(0);
    }
    setIsPlaying(true);
  }, [currentStepIndex, snapshots.length]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const restart = useCallback(() => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  }, []);

  const toggleVisualizerTheme = () => {
    setVisualizerTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Auto playback interval effect
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(200, 1500 / speed);
      playTimerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev < snapshots.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            clearInterval(playTimerRef.current);
            return prev;
          }
        });
      }, intervalMs);
    } else {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    }

    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, speed, snapshots.length]);

  // Automatically trigger visualization on initial mount / preset load
  useEffect(() => {
    visualizeCode();
  }, [language, conceptLevel]);

  const currentSnapshot = snapshots[currentStepIndex] || null;

  return (
    <VisualizerContext.Provider
      value={{
        language,
        setLanguage,
        conceptLevel,
        setConceptLevel,
        code,
        setCode,
        snapshots,
        currentStepIndex,
        currentSnapshot,
        isPlaying,
        speed,
        setSpeed,
        isAnalyzing,
        visualizerTheme,
        activeTab,
        setActiveTab,
        loadPreset,
        visualizeCode,
        nextStep,
        prevStep,
        seekStep,
        play,
        pause,
        restart,
        toggleVisualizerTheme,
      }}
    >
      {children}
    </VisualizerContext.Provider>
  );
};

export const useVisualizer = () => {
  const context = useContext(VisualizerContext);
  if (!context) {
    throw new Error("useVisualizer must be used within a VisualizerProvider");
  }
  return context;
};
