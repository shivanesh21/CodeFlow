import fs from "fs/promises";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const TEMP_DIR = path.join(process.cwd(), "temp");

// Create temp folder if it doesn't exist
async function ensureTempDirectory() {
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  } catch (error) {
    console.error(error);
  }
}

// =======================================================
// Execute JavaScript Code
// =======================================================
export const executeJavaScript = async (code) => {
  await ensureTempDirectory();

  const fileName = `code_${Date.now()}.js`;
  const filePath = path.join(TEMP_DIR, fileName);

  try {
    // Save code to temporary file
    await fs.writeFile(filePath, code, "utf8");

    const startTime = Date.now();

    const { stdout, stderr } = await execFileAsync(
      "node",
      [filePath],
      {
        timeout: 5000,
      }
    );

    const endTime = Date.now();

    // Delete temporary file
    await fs.unlink(filePath);

    return {
      success: true,
      output: stdout,
      error: stderr,
      executionTime: endTime - startTime,
      exitCode: 0,
    };
  } catch (error) {
    // Clean up temp file
    try {
      await fs.unlink(filePath);
    } catch {}

    return {
      success: false,
      output: "",
      error: error.stderr || error.message,
      executionTime: 0,
      exitCode: error.code ?? 1,
    };
  }
};