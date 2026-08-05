import fs from "fs/promises";
import path from "path";
import { exec, spawn } from "child_process";
import v8 from "v8";

// Configuration limits for isolated execution
const TIMEOUT_LIMIT = 5000; // 5 seconds maximum execution time
const MAX_BUFFER = 1024 * 1024; // 1 MB max output buffer
const TEMP_DIR = path.join(process.cwd(), "temp_execution");

// Ensure temporary execution directory exists
async function ensureTempDir() {
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  } catch (error) {
    console.error("Failed to create temporary directory:", error);
  }
}

// Safely clean up created temporary files/directories
async function cleanUpTempFiles(files = []) {
  for (const file of files) {
    if (file) {
      try {
        await fs.rm(file, { force: true, recursive: true });
      } catch (err) {
        // Silently ignore cleanup errors
      }
    }
  }
}

/**
 * Executes a process with strict timeout, stdin input support, and output capture
 */
function runProcess(command, args, options = {}, input = "") {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let stdout = "";
    let stderr = "";
    let isTimedOut = false;

    const child = spawn(command, args, {
      cwd: options.cwd || TEMP_DIR,
      env: { PATH: process.env.PATH }, // Strict environment variable isolation
      windowsHide: true,
    });

    const timer = setTimeout(() => {
      isTimedOut = true;
      child.kill("SIGKILL");
    }, options.timeout || TIMEOUT_LIMIT);

    if (input) {
      child.stdin.write(input);
    }
    child.stdin.end();

    child.stdout.on("data", (data) => {
      if (stdout.length < MAX_BUFFER) {
        stdout += data.toString();
      }
    });

    child.stderr.on("data", (data) => {
      if (stderr.length < MAX_BUFFER) {
        stderr += data.toString();
      }
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      const executionTime = Date.now() - startTime;
      resolve({
        success: false,
        output: "",
        error: err.message || "Failed to start execution process",
        executionTime,
        memoryUsed: 0,
        exitCode: 1,
        status: "error",
      });
    });

    child.on("close", (exitCode) => {
      clearTimeout(timer);
      const executionTime = Date.now() - startTime;
      const memoryUsed = Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100;

      if (isTimedOut) {
        resolve({
          success: false,
          output: stdout.trim(),
          error: `Execution timed out after ${TIMEOUT_LIMIT / 1000} seconds.`,
          executionTime,
          memoryUsed,
          exitCode: 124,
          status: "timeout",
        });
        return;
      }

      if (exitCode !== 0) {
        resolve({
          success: false,
          output: stdout.trim(),
          error: stderr.trim() || `Process exited with code ${exitCode}`,
          executionTime,
          memoryUsed,
          exitCode: exitCode || 1,
          status: "runtime_error",
        });
        return;
      }

      resolve({
        success: true,
        output: stdout.trim(),
        error: stderr.trim(),
        executionTime,
        memoryUsed,
        exitCode: 0,
        status: "success",
      });
    });
  });
}

// =======================================================
// JavaScript Execution
// =======================================================
export const executeJavaScript = async (code, input = "") => {
  await ensureTempDir();
  const fileId = `js_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const filePath = path.join(TEMP_DIR, `${fileId}.js`);

  try {
    await fs.writeFile(filePath, code, "utf8");
    const result = await runProcess("node", [filePath], { cwd: TEMP_DIR }, input);
    return result;
  } finally {
    await cleanUpTempFiles([filePath]);
  }
};

// =======================================================
// Python Execution
// =======================================================
export const executePython = async (code, input = "") => {
  await ensureTempDir();
  const fileId = `py_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const filePath = path.join(TEMP_DIR, `${fileId}.py`);

  // Detect python command (python3 or python)
  const pythonCmd = process.platform === "win32" ? "python" : "python3";

  try {
    await fs.writeFile(filePath, code, "utf8");
    const result = await runProcess(pythonCmd, [filePath], { cwd: TEMP_DIR }, input);
    return result;
  } finally {
    await cleanUpTempFiles([filePath]);
  }
};

// =======================================================
// Java Execution
// =======================================================
export const executeJava = async (code, input = "") => {
  await ensureTempDir();
  const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const folderPath = path.join(TEMP_DIR, `java_${uniqueId}`);
  await fs.mkdir(folderPath, { recursive: true });

  // Extract public class name or fallback to Main
  const classNameMatch = code.match(/public\s+class\s+([A-Za-z0-9_]+)/);
  const className = classNameMatch ? classNameMatch[1] : "Main";
  const filePath = path.join(folderPath, `${className}.java`);

  try {
    await fs.writeFile(filePath, code, "utf8");

    // Step 1: Compile Java Code
    const compileResult = await runProcess("javac", [filePath], { cwd: folderPath });
    if (!compileResult.success) {
      return {
        success: false,
        output: "",
        error: compileResult.error || compileResult.output || "Java Compilation Error",
        executionTime: compileResult.executionTime,
        memoryUsed: 0,
        exitCode: 1,
        status: "compilation_error",
      };
    }

    // Step 2: Run Compiled Java Class
    const runResult = await runProcess("java", ["-cp", folderPath, className], { cwd: folderPath }, input);
    return runResult;
  } finally {
    await cleanUpTempFiles([folderPath]);
  }
};

// =======================================================
// C++ Execution
// =======================================================
export const executeCpp = async (code, input = "") => {
  await ensureTempDir();
  const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const filePath = path.join(TEMP_DIR, `cpp_${uniqueId}.cpp`);
  const exeName = process.platform === "win32" ? `cpp_${uniqueId}.exe` : `./cpp_${uniqueId}.out`;
  const exePath = path.join(TEMP_DIR, exeName);

  try {
    await fs.writeFile(filePath, code, "utf8");

    // Step 1: Compile C++ Code with g++
    const compileResult = await runProcess("g++", ["-O2", filePath, "-o", exePath], { cwd: TEMP_DIR });
    if (!compileResult.success) {
      return {
        success: false,
        output: "",
        error: compileResult.error || compileResult.output || "C++ Compilation Error",
        executionTime: compileResult.executionTime,
        memoryUsed: 0,
        exitCode: 1,
        status: "compilation_error",
      };
    }

    // Step 2: Run Executable
    const runCmd = process.platform === "win32" ? exePath : `./${path.basename(exePath)}`;
    const runResult = await runProcess(runCmd, [], { cwd: TEMP_DIR }, input);
    return runResult;
  } finally {
    await cleanUpTempFiles([filePath, exePath]);
  }
};

// =======================================================
// C Execution
// =======================================================
export const executeC = async (code, input = "") => {
  await ensureTempDir();
  const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const filePath = path.join(TEMP_DIR, `c_${uniqueId}.c`);
  const exeName = process.platform === "win32" ? `c_${uniqueId}.exe` : `./c_${uniqueId}.out`;
  const exePath = path.join(TEMP_DIR, exeName);

  try {
    await fs.writeFile(filePath, code, "utf8");

    const compileResult = await runProcess("gcc", ["-O2", filePath, "-o", exePath], { cwd: TEMP_DIR });
    if (!compileResult.success) {
      return {
        success: false,
        output: "",
        error: compileResult.error || compileResult.output || "C Compilation Error",
        executionTime: compileResult.executionTime,
        memoryUsed: 0,
        exitCode: 1,
        status: "compilation_error",
      };
    }

    const runCmd = process.platform === "win32" ? exePath : `./${path.basename(exePath)}`;
    return await runProcess(runCmd, [], { cwd: TEMP_DIR }, input);
  } finally {
    await cleanUpTempFiles([filePath, exePath]);
  }
};

// =======================================================
// Master Dispatcher function
// =======================================================
export const executeCode = async (language, code, input = "") => {
  if (!language || !code) {
    return {
      success: false,
      output: "",
      error: "Language and code are required.",
      executionTime: 0,
      memoryUsed: 0,
      exitCode: 1,
      status: "error",
    };
  }

  const langKey = language.toLowerCase();

  switch (langKey) {
    case "javascript":
    case "js":
      return await executeJavaScript(code, input);

    case "python":
    case "py":
      return await executePython(code, input);

    case "java":
      return await executeJava(code, input);

    case "cpp":
    case "c++":
    case "c_cpp":
      return await executeCpp(code, input);

    case "c":
      return await executeC(code, input);

    default:
      return {
        success: false,
        output: "",
        error: `Unsupported language: '${language}'. Supported: JavaScript, Python, Java, C++, C.`,
        executionTime: 0,
        memoryUsed: 0,
        exitCode: 1,
        status: "error",
      };
  }
};
