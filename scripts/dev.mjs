import { spawn } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const processes = [
  {
    name: "server",
    command: `${npmCommand} --prefix server run dev`,
    args: ["--prefix", "server", "run", "dev"],
  },
  {
    name: "client",
    command: `${npmCommand} --prefix client run dev`,
    args: ["--prefix", "client", "run", "dev"],
  },
];

let shuttingDown = false;

const children = processes.map(({ name, command, args }) => {
  const child = spawn(process.platform === "win32" ? command : npmCommand, process.platform === "win32" ? [] : args, {
    cwd: process.cwd(),
    env: process.env,
    shell: process.platform === "win32",
    stdio: "inherit",
  });

  child.on("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }

    if (code !== 0) {
      console.error(`${name} exited with code ${code ?? signal}`);
      shutdown(code ?? 1);
    }
  });

  return child;
});

function shutdown(exitCode = 0) {
  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }

  process.exit(exitCode);
}

process.on("SIGINT", () => shutdown());
process.on("SIGTERM", () => shutdown());
