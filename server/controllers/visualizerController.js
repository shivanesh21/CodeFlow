import VisualizerSession from "../models/VisualizerSession.js";

// Multi-language Trace Generator backend helper
function generateTraceSnapshots(code, language) {
  const lines = code.split("\n");
  const snapshots = [];
  let consoleLogs = [];
  let variableStore = {};
  let currentHeap = [];
  let memoryAddressCounter = 0x7ff00;

  lines.forEach((lineText, idx) => {
    const lineNumber = idx + 1;
    const trimmed = lineText.trim();
    if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed.startsWith("/*")) {
      return;
    }

    let explanation = `Executing line ${lineNumber}: "${trimmed}"`;
    let conceptType = "STATEMENT";

    // Handle variable declarations across JavaScript, Python, Java, C++
    let varMatch = null;
    
    // JS / Generic match: let/const/var x = 10;
    if (language === "javascript") {
      varMatch = trimmed.match(/^(?:let|const|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(.+);?$/);
    } else if (language === "python") {
      varMatch = trimmed.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(.+)$/);
    } else if (language === "java" || language === "cpp") {
      varMatch = trimmed.match(/^(?:int|double|float|boolean|String|char|auto)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(.+);?$/);
    }

    if (varMatch) {
      const name = varMatch[1];
      const valRaw = varMatch[2].replace(/;$/, "").trim();
      let value = valRaw;
      let type = "string";

      if (!isNaN(valRaw)) {
        value = Number(valRaw);
        type = "number";
      } else if (valRaw === "true" || valRaw === "false") {
        value = valRaw === "true";
        type = "boolean";
      } else if (valRaw.startsWith('"') || valRaw.startsWith("'")) {
        value = valRaw.slice(1, -1);
        type = "string";
      }

      memoryAddressCounter += 4;
      const memAddr = `0x${memoryAddressCounter.toString(16).toUpperCase()}`;

      variableStore[name] = {
        name,
        value,
        type,
        memoryAddr,
        declaredAtLine: lineNumber,
        isMutated: false,
      };

      conceptType = "VARIABLE_DECLARATION";
      explanation = `Declared variable "${name}" of type ${type} in Stack Memory [${memAddr}] with value: ${JSON.stringify(value)}.`;
    }

    // Console / Print statements
    const printMatch = trimmed.match(/(?:console\.log|print|System\.out\.println|std::cout\s*<<)\s*\(?([^;]+)\)?/);
    if (printMatch) {
      let printContent = printMatch[1].replace(/;$/, "").replace(/<<\s*std::endl/, "").trim();
      if (variableStore[printContent]) {
        consoleLogs.push(String(variableStore[printContent].value));
      } else {
        consoleLogs.push(printContent.replace(/^["']|["']$/g, ""));
      }
      conceptType = "OUTPUT";
      explanation = `Output line printed to Console: ${consoleLogs[consoleLogs.length - 1]}`;
    }

    snapshots.push({
      stepIndex: snapshots.length,
      currentLine: lineNumber,
      lineCode: trimmed,
      explanation,
      conceptType,
      variables: JSON.parse(JSON.stringify(variableStore)),
      objects: {},
      arrays: {},
      callStack: [{ functionName: "main", line: lineNumber, scope: "global" }],
      heap: currentHeap,
      pointers: [],
      consoleOutput: [...consoleLogs],
      executionTimeMs: snapshots.length * 1.5,
    });
  });

  return snapshots;
}

export const getTraceSnapshots = async (req, res) => {
  try {
    const { code, language = "javascript" } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: "Code parameter is required" });
    }

    const snapshots = generateTraceSnapshots(code, language);
    return res.status(200).json({
      success: true,
      totalSteps: snapshots.length,
      snapshots,
    });
  } catch (error) {
    console.error("Error generating visualizer trace:", error);
    return res.status(500).json({ success: false, message: "Trace generation failed", error: error.message });
  }
};

export const saveVisualizerSession = async (req, res) => {
  try {
    const { title, language, code, conceptLevel, conceptName, snapshots } = req.body;

    const newSession = await VisualizerSession.create({
      userId: req.user ? req.user._id : null,
      title: title || "Saved Visualization",
      language,
      code,
      conceptLevel,
      conceptName,
      totalSteps: snapshots?.length || 0,
      snapshots,
    });

    return res.status(201).json({
      success: true,
      message: "Visualization session saved successfully",
      session: newSession,
    });
  } catch (error) {
    console.error("Error saving visualization session:", error);
    return res.status(500).json({ success: false, message: "Failed to save session", error: error.message });
  }
};

export const getVisualizerSessions = async (req, res) => {
  try {
    const query = req.user ? { userId: req.user._id } : {};
    const sessions = await VisualizerSession.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: sessions.length,
      sessions,
    });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch sessions", error: error.message });
  }
};
