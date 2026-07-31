/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║   CodeFlow – Advanced JavaScript Step Trace & Snapshot Engine   ║
 * ║   Covers ALL 15 Concepts:                                       ║
 * ║   1. Variables & Primitives     2. Type Coercion & Operators    ║
 * ║   3. Branching (if/else)        4. Switch / Ternary             ║
 * ║   5. Console.log (Output)       6. Variable Reassignment        ║
 * ║   7. Increment / Decrement      8. Property / Index Assignment  ║
 * ║   9. String concat / template   10. Loops (for/while/do-while) ║
 * ║   11. Functions & Recursion     12. String methods              ║
 * ║   13. Objects & Arrays          14. Async / Promises / await    ║
 * ║   15. Closures & `this`                                        ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

// ─── helpers ──────────────────────────────────────────────────────────────────

let _addrCounter = 0x7ff00;
function nextAddr() {
  _addrCounter += 4;
  return `0x${_addrCounter.toString(16).toUpperCase()}`;
}

function resetAddr() {
  _addrCounter = 0x7ff00;
}

function typeLabel(v) {
  if (v === null) return "null";
  if (v === undefined) return "undefined";
  if (Array.isArray(v)) return "array";
  if (v instanceof Promise) return "Promise";
  return typeof v;
}

/** Deeply clone, handling circular refs gracefully */
function safeClone(obj) {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    if (typeof obj === "object" && obj !== null) {
      const result = Array.isArray(obj) ? [] : {};
      for (const key of Object.keys(obj)) {
        try {
          result[key] = JSON.parse(JSON.stringify(obj[key]));
        } catch {
          result[key] = String(obj[key]);
        }
      }
      return result;
    }
    return {};
  }
}

// ─── main export ──────────────────────────────────────────────────────────────

export function generateJsSnapshots(code) {
  resetAddr();

  const lines = code.split("\n");
  const snapshots = [];

  // shared mutable state
  const vars = {};          // { [name]: { name, value, type, memoryAddr, kind, isMutated, declaredAtLine } }
  const heap = {};          // { [addr]: { type, value, label } }
  const arrays = {};        // { [name]: Array }
  const objects = {};       // { [name]: Object }
  const consoleLogs = [];
  const callStack = [
    { id: "frame-global", functionName: "Global Execution Context", line: 0, scope: "global", locals: {} }
  ];
  const closureEnvs = {};   // { [fnName]: captured vars snapshot }
  const funcRegistry = {};  // { [fnName]: { params, bodyLines, isAsync, declLine } }
  const asyncQueue = [];    // deferred async snapshots

  const MAX_LOOP_ITERS = 50;
  const MAX_RECURSION = 20;
  let recursionDepth = 0;

  // ── snapshot builder ────────────────────────────────────────────
  function pushSnap(lineNumber, trimmedLine, conceptType, explanation, extras = {}) {
    snapshots.push({
      stepIndex: snapshots.length,
      totalSteps: 0,
      currentLine: lineNumber,
      lineCode: trimmedLine,
      conceptType,
      explanation,
      mutatedVar: extras.mutatedVar || null,
      variables: safeClone(vars),
      objects: safeClone(objects),
      arrays: safeClone(arrays),
      heap: safeClone(heap),
      callStack: safeClone(callStack),
      consoleOutput: [...consoleLogs],
      loopData: extras.loopData || null,
      branchData: extras.branchData || null,
      functionData: extras.functionData || null,
      stringData: extras.stringData || null,
      asyncData: extras.asyncData || null,
      closureData: extras.closureData || null,
      executionTimeMs: (snapshots.length + 1) * 2,
    });
  }

  // ── resolve expression using current vars ───────────────────────
  function resolveExpr(expr, localVars) {
    try {
      const v = localVars || vars;
      let e = expr.trim().replace(/;$/, "");
      // inject known variable values, longest names first to avoid partial replacement
      const names = Object.keys(v).sort((a, b) => b.length - a.length);
      names.forEach((name) => {
        const re = new RegExp(`\\b${name}\\b`, "g");
        const val = v[name]?.value;
        if (val !== undefined && typeof val !== "function" && typeof val !== "object") {
          e = e.replace(re, JSON.stringify(val));
        }
      });
      // eslint-disable-next-line no-new-func
      return Function('"use strict"; return (' + e + ")")();
    } catch {
      return undefined;
    }
  }

  // ── value parser ─────────────────────────────────────────────────
  function parseValue(raw) {
    const t = (raw || "").trim().replace(/;$/, "");
    if (t === "true")      return { val: true,      type: "boolean" };
    if (t === "false")     return { val: false,     type: "boolean" };
    if (t === "null")      return { val: null,       type: "null"    };
    if (t === "undefined") return { val: undefined,  type: "undefined" };
    if (!isNaN(t) && t !== "" && !t.includes(" ")) return { val: Number(t), type: "number" };

    // string literal
    if ((t.startsWith('"') && t.endsWith('"')) ||
        (t.startsWith("'") && t.endsWith("'")) ||
        (t.startsWith("`") && t.endsWith("`"))) {
      let strVal = t.slice(1, -1);
      if (t.startsWith("`")) {
        strVal = strVal.replace(/\$\{([^}]+)\}/g, (_, expr) => {
          const v = resolveExpr(expr);
          return v !== undefined ? String(v) : expr;
        });
      }
      return { val: strVal, type: "string" };
    }

    // array literal
    if (t.startsWith("[")) {
      try {
        const v = resolveExpr(t);
        if (Array.isArray(v)) return { val: v, type: "array" };
      } catch {}
      // fallback: try JSON parse
      try {
        const v = JSON.parse(t);
        if (Array.isArray(v)) return { val: v, type: "array" };
      } catch {}
    }

    // object literal
    if (t.startsWith("{") && t.endsWith("}")) {
      try {
        const v = resolveExpr(`(${t})`);
        if (v && typeof v === "object") return { val: v, type: "object" };
      } catch {}
      try {
        const v = JSON.parse(t);
        if (v && typeof v === "object") return { val: v, type: "object" };
      } catch {}
    }

    // new Promise(...)
    if (t.startsWith("new Promise") || t.startsWith("Promise.")) {
      return { val: "[Promise<pending>]", type: "Promise" };
    }

    // resolve references / expressions
    const resolved = resolveExpr(t);
    if (resolved !== undefined) {
      return { val: resolved, type: typeLabel(resolved) };
    }

    // string concatenation with + operator
    if (t.includes("+")) {
      const parts = t.split("+").map(p => p.trim());
      let hasString = false;
      const joined = parts.map(p => {
        const v = resolveExpr(p);
        if (typeof v === "string") hasString = true;
        return v !== undefined ? String(v) : p.replace(/^['"`]|['"`]$/g, "");
      }).join("");
      if (hasString) {
        return { val: joined, type: "string" };
      }
    }

    return { val: t, type: "string" };
  }

  // ── string method detector ────────────────────────────────────────
  function detectStringMethod(expr) {
    const methods = ["toUpperCase", "toLowerCase", "trim", "trimStart", "trimEnd",
      "slice", "substring", "charAt", "charCodeAt",
      "indexOf", "lastIndexOf", "includes", "startsWith", "endsWith",
      "replace", "replaceAll", "split", "repeat",
      "padStart", "padEnd", "length", "at", "concat"];
    for (const m of methods) {
      const re = new RegExp(`(.+)\\.(${m})(?:\\((.*)\\))?`);
      const match = expr.match(re);
      if (match) {
        const target = match[1].trim();
        const method = match[2];
        const args   = match[3] || "";
        const baseVal = resolveExpr(target);
        if (typeof baseVal === "string") {
          try {
            if (method === "length") {
              return { found: true, method, baseVal, result: baseVal.length, args: "" };
            }
            // eslint-disable-next-line no-new-func
            const result = Function('"use strict"; const s=' + JSON.stringify(baseVal) + "; return s." + method + "(" + args + ")")();
            return { found: true, method, baseVal, result, args };
          } catch {}
        }
      }
    }
    return { found: false };
  }

  // ── collect block body (between braces) ───────────────────────
  function collectBlock(startIdx) {
    const bodyLines = [];
    let depth = 0;
    let j = startIdx;

    // check if current line has opening brace
    if (j < lines.length && lines[startIdx - 1]?.trim().endsWith("{")) {
      depth = 1;
    } else if (j < lines.length && lines[j]?.trim() === "{") {
      depth = 1;
      j++;
    }

    while (j < lines.length && depth > 0) {
      const bl = lines[j].trim();
      if (bl.includes("{")) {
        // count braces in line
        for (const ch of bl) {
          if (ch === "{") depth++;
          if (ch === "}") depth--;
        }
        if (depth > 0) bodyLines.push({ text: bl, lineNum: j + 1 });
        j++;
      } else if (bl.includes("}")) {
        for (const ch of bl) {
          if (ch === "}") depth--;
        }
        if (depth > 0) bodyLines.push({ text: bl, lineNum: j + 1 });
        j++;
      } else {
        if (depth > 0) bodyLines.push({ text: bl, lineNum: j + 1 });
        j++;
      }
    }
    return { bodyLines, endIdx: j };
  }

  // ── execute a single line within current scope ────────────────
  function executeLine(lineStr, lineNumber) {
    const t = lineStr.trim();

    // skip blank / comment lines / closing braces
    if (!t || t.startsWith("//") || t.startsWith("*") || t.startsWith("/*") || t === "}" || t === "{" || t === "};") {
      return;
    }

    // ── VARIABLE DECLARATION ──────────────────────────────────
    const declMatch = t.match(/^(let|const|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(.+?);?$/);
    if (declMatch) {
      const kind    = declMatch[1];
      const varName = declMatch[2];
      const rhs     = declMatch[3].trim();
      const addr    = nextAddr();

      // Function expression
      const funcExprMatch = rhs.match(/^(?:async\s+)?function\s*\(([^)]*)\)\s*\{?$/);
      const arrowMatch = rhs.match(/^(?:async\s+)?\(([^)]*)\)\s*=>\s*\{?(.*)$/);
      if (funcExprMatch || arrowMatch) {
        const params = (funcExprMatch ? funcExprMatch[1] : arrowMatch[1])
          .split(",").map(p => p.trim()).filter(Boolean);
        const isAsync = rhs.startsWith("async");
        closureEnvs[varName] = safeClone(vars);
        vars[varName] = {
          name: varName, value: `[Function: ${varName}]`, type: "function",
          memoryAddr: addr, kind, isMutated: false, declaredAtLine: lineNumber,
        };
        // Don't store body here — it will be collected in the main loop
        pushSnap(lineNumber, t, isAsync ? "ASYNC_FUNCTION_DECLARATION" : "FUNCTION_DECLARATION",
          `${isAsync ? "Async f" : "F"}unction expression '${varName}' declared with params: [${params.join(", ")}].`,
          { functionData: { name: varName, params, isAsync } });
        return;
      }

      // Array literal
      if (rhs.startsWith("[")) {
        const { val } = parseValue(rhs);
        const arr = Array.isArray(val) ? val : [];
        arrays[varName] = arr;
        heap[addr] = { type: "array", value: [...arr], label: varName };
        vars[varName] = { name: varName, value: `→ ${addr}`, type: "array", memoryAddr: addr, kind, isMutated: false, declaredAtLine: lineNumber };
        pushSnap(lineNumber, t, "ARRAY_DECLARATION",
          `Declared array '${varName}' with ${arr.length} element(s): [${arr.map(v => JSON.stringify(v)).join(", ")}]. Stored in heap at ${addr}.`,
          { mutatedVar: varName });
        return;
      }

      // Object literal
      if (rhs.startsWith("{")) {
        const { val } = parseValue(rhs);
        const obj = (val && typeof val === "object") ? val : {};
        objects[varName] = obj;
        heap[addr] = { type: "object", value: safeClone(obj), label: varName };
        vars[varName] = { name: varName, value: `→ ${addr}`, type: "object", memoryAddr: addr, kind, isMutated: false, declaredAtLine: lineNumber };
        pushSnap(lineNumber, t, "OBJECT_CREATION",
          `Created object '${varName}' with keys: [${Object.keys(obj).join(", ")}]. Reference stored at ${addr}.`,
          { mutatedVar: varName });
        return;
      }

      // new Promise
      if (rhs.startsWith("new Promise") || rhs.startsWith("Promise.")) {
        vars[varName] = { name: varName, value: "[Promise<pending>]", type: "Promise", memoryAddr: addr, kind, isMutated: false, declaredAtLine: lineNumber };
        pushSnap(lineNumber, t, "PROMISE_CREATION",
          `Created a new Promise '${varName}'. Status: ⏳ pending. Will resolve/reject asynchronously.`,
          { mutatedVar: varName, asyncData: { promiseName: varName, state: "pending" } });
        return;
      }

      // await expression
      const awaitRhsMatch = rhs.match(/^await\s+(.+)$/);
      if (awaitRhsMatch) {
        const awaitExpr = awaitRhsMatch[1];
        pushSnap(lineNumber, t, "ASYNC_AWAIT_START",
          `⏳ Awaiting: "${awaitExpr}". Execution paused until Promise resolves.`,
          { asyncData: { stage: "await-start", expression: awaitExpr, varName } });

        // Check if it's a function call we know about
        const fnCallInAwait = awaitExpr.match(/^([a-zA-Z_$]\w*)\(([^)]*)\)$/);
        let resolvedVal = "[resolved]";
        if (fnCallInAwait && funcRegistry[fnCallInAwait[1]]) {
          resolvedVal = executeFunction(fnCallInAwait[1], fnCallInAwait[2], lineNumber) ?? "[resolved]";
        }
        vars[varName] = { name: varName, value: resolvedVal, type: typeof resolvedVal, memoryAddr: addr, kind, isMutated: false, declaredAtLine: lineNumber };
        pushSnap(lineNumber, t, "ASYNC_AWAIT_RESOLVED",
          `✅ Promise resolved! '${varName}' = ${JSON.stringify(resolvedVal)}. Execution resumed.`,
          { mutatedVar: varName, asyncData: { stage: "resolved", varName, value: resolvedVal } });
        return;
      }

      // String method call on RHS
      const sm = detectStringMethod(rhs);
      if (sm.found) {
        vars[varName] = { name: varName, value: sm.result, type: typeof sm.result, memoryAddr: addr, kind, isMutated: false, declaredAtLine: lineNumber };
        pushSnap(lineNumber, t, "STRING_METHOD",
          `Called .${sm.method}() on "${sm.baseVal}" → result: ${JSON.stringify(sm.result)}. Stored in '${varName}'.`,
          { mutatedVar: varName, stringData: { method: sm.method, base: sm.baseVal, args: sm.args, result: sm.result } });
        return;
      }

      // Function call on RHS: let result = add(3, 7)
      const rhsFnCall = rhs.match(/^([a-zA-Z_$]\w*)\(([^)]*)\)$/);
      if (rhsFnCall && funcRegistry[rhsFnCall[1]]) {
        const retVal = executeFunction(rhsFnCall[1], rhsFnCall[2], lineNumber);
        vars[varName] = { name: varName, value: retVal, type: typeLabel(retVal), memoryAddr: addr, kind, isMutated: false, declaredAtLine: lineNumber };
        pushSnap(lineNumber, t, "VARIABLE_DECLARATION",
          `Declared ${kind} '${varName}' = ${JSON.stringify(retVal)} (returned from ${rhsFnCall[1]}()).`,
          { mutatedVar: varName });
        return;
      }

      // Ternary on RHS
      const ternaryRhs = rhs.match(/^(.+)\s*\?\s*(.+)\s*:\s*(.+)$/);
      if (ternaryRhs) {
        const cond = ternaryRhs[1].trim();
        const truePart = ternaryRhs[2].trim();
        const falsePart = ternaryRhs[3].trim();
        const condVal = resolveExpr(cond);
        const chosen = condVal ? truePart : falsePart;
        const { val } = parseValue(chosen);
        vars[varName] = { name: varName, value: val, type: typeLabel(val), memoryAddr: addr, kind, isMutated: false, declaredAtLine: lineNumber };
        pushSnap(lineNumber, t, "TERNARY_EVALUATION",
          `Ternary: (${cond}) → ${condVal ? "true" : "false"}, chose ${chosen}. '${varName}' = ${JSON.stringify(val)}.`,
          { mutatedVar: varName, branchData: { type: "ternary", condition: cond, result: condVal, chosen } });
        return;
      }

      // Normal primitive / expression
      const { val, type } = parseValue(rhs);
      vars[varName] = { name: varName, value: val, type, memoryAddr: addr, kind, isMutated: false, declaredAtLine: lineNumber };

      let explanation = `Allocated [${addr}]. Declared ${kind} '${varName}' (${type}) = ${JSON.stringify(val)}.`;
      let conceptType = "VARIABLE_DECLARATION";

      if (type === "string" && rhs.includes("+")) {
        conceptType = "STRING_CONCAT";
        explanation = `String concatenation. '${varName}' = "${val}" (joined from parts).`;
      } else if (rhs.startsWith("`")) {
        conceptType = "TEMPLATE_LITERAL";
        explanation = `Template literal interpolation. '${varName}' = "${val}".`;
      }

      pushSnap(lineNumber, t, conceptType, explanation, { mutatedVar: varName });
      return;
    }

    // ── PROPERTY ASSIGNMENT (obj.prop = val) ─────────────────────
    const propAssignMatch = t.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\.([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(.+?);?$/);
    if (propAssignMatch) {
      const objName  = propAssignMatch[1];
      const propName = propAssignMatch[2];
      const rhs      = propAssignMatch[3];
      const { val }  = parseValue(rhs);
      if (objects[objName]) {
        const oldVal = objects[objName][propName];
        objects[objName][propName] = val;
        // update heap
        const heapAddr = vars[objName]?.memoryAddr;
        if (heapAddr && heap[heapAddr]) {
          heap[heapAddr].value = safeClone(objects[objName]);
        }
        pushSnap(lineNumber, t, "PROPERTY_ASSIGNMENT",
          `Set '${objName}.${propName}' = ${JSON.stringify(val)}${oldVal !== undefined ? ` (was ${JSON.stringify(oldVal)})` : " (new property)"}.`,
          { mutatedVar: objName });
      }
      return;
    }

    // ── ARRAY INDEX ASSIGNMENT (arr[i] = val) ────────────────────
    const arrIndexMatch = t.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\[(\d+)\]\s*=\s*(.+?);?$/);
    if (arrIndexMatch) {
      const arrName = arrIndexMatch[1];
      const idx     = parseInt(arrIndexMatch[2], 10);
      const rhs     = arrIndexMatch[3];
      const { val } = parseValue(rhs);
      if (arrays[arrName]) {
        const old = arrays[arrName][idx];
        arrays[arrName][idx] = val;
        const heapAddr = vars[arrName]?.memoryAddr;
        if (heapAddr && heap[heapAddr]) {
          heap[heapAddr].value = [...arrays[arrName]];
        }
        pushSnap(lineNumber, t, "ARRAY_ELEMENT_MUTATION",
          `Set ${arrName}[${idx}] = ${JSON.stringify(val)}${old !== undefined ? ` (was ${JSON.stringify(old)})` : ""}.`,
          { mutatedVar: arrName });
      }
      return;
    }

    // ── ARRAY METHOD CALL ────────────────────────────────────────
    const arrMethodMatch = t.match(/^(?:(?:let|const|var)\s+([a-zA-Z_$]\w*)\s*=\s*)?([a-zA-Z_$]\w*)\.(push|pop|shift|unshift|splice|reverse|sort|indexOf|includes|find|filter|map|forEach|join|slice|concat)\(([^)]*)\);?$/);
    if (arrMethodMatch) {
      const resultVar = arrMethodMatch[1];
      const arrName   = arrMethodMatch[2];
      const method    = arrMethodMatch[3];
      const argsStr   = arrMethodMatch[4];

      if (arrays[arrName]) {
        const before = [...arrays[arrName]];
        let methodResult;

        // Parse arguments
        const argVals = argsStr ? argsStr.split(",").map(a => parseValue(a.trim()).val) : [];

        // Execute method
        switch (method) {
          case "push":    methodResult = arrays[arrName].push(...argVals); break;
          case "pop":     methodResult = arrays[arrName].pop(); break;
          case "shift":   methodResult = arrays[arrName].shift(); break;
          case "unshift": methodResult = arrays[arrName].unshift(...argVals); break;
          case "reverse": arrays[arrName].reverse(); methodResult = arrays[arrName]; break;
          case "sort":    arrays[arrName].sort(); methodResult = arrays[arrName]; break;
          case "indexOf": methodResult = arrays[arrName].indexOf(argVals[0]); break;
          case "includes":methodResult = arrays[arrName].includes(argVals[0]); break;
          case "join":    methodResult = arrays[arrName].join(argVals[0] || ","); break;
          case "slice":   methodResult = arrays[arrName].slice(argVals[0], argVals[1]); break;
          case "splice":  methodResult = arrays[arrName].splice(...argVals); break;
          default:        methodResult = undefined;
        }

        // Update heap
        const heapAddr = vars[arrName]?.memoryAddr;
        if (heapAddr && heap[heapAddr]) {
          heap[heapAddr].value = [...arrays[arrName]];
        }

        // Store result if assigned
        if (resultVar) {
          const addr = nextAddr();
          vars[resultVar] = { name: resultVar, value: methodResult, type: typeLabel(methodResult), memoryAddr: addr, kind: "let", isMutated: false, declaredAtLine: lineNumber };
        }

        pushSnap(lineNumber, t, "ARRAY_METHOD",
          `${arrName}.${method}(${argsStr}): [${before.map(v => JSON.stringify(v)).join(",")}] → [${arrays[arrName].map(v => JSON.stringify(v)).join(",")}].${resultVar ? ` Returned: ${JSON.stringify(methodResult)}` : ""}`,
          { mutatedVar: arrName });
        return;
      }
    }

    // ── REASSIGNMENT ─────────────────────────────────────────────
    const reassignMatch = t.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*([+\-*/%]?=)\s*(.+?);?$/);
    if (reassignMatch && !t.startsWith("let") && !t.startsWith("const") && !t.startsWith("var")) {
      const varName  = reassignMatch[1];
      const op       = reassignMatch[2];
      const rhs      = reassignMatch[3];

      if (vars[varName]) {
        const oldVal  = vars[varName].value;

        // Check if RHS is a function call
        const rhsFnCall2 = rhs.match(/^([a-zA-Z_$]\w*)\(([^)]*)\)$/);
        let rVal;
        if (rhsFnCall2 && funcRegistry[rhsFnCall2[1]]) {
          rVal = executeFunction(rhsFnCall2[1], rhsFnCall2[2], lineNumber);
        } else {
          // String method check
          const sm2 = detectStringMethod(rhs);
          if (sm2.found) {
            rVal = sm2.result;
            let newVal = op === "=" ? rVal : oldVal + rVal;
            vars[varName].value = newVal;
            vars[varName].type = typeLabel(newVal);
            vars[varName].isMutated = true;
            pushSnap(lineNumber, t, "STRING_METHOD",
              `Called .${sm2.method}() on "${sm2.baseVal}" → "${sm2.result}", assigned to '${varName}'.`,
              { mutatedVar: varName, stringData: { method: sm2.method, base: sm2.baseVal, result: sm2.result } });
            return;
          }
          rVal = parseValue(rhs).val;
        }

        let newVal = rVal;
        if (op === "+=")      newVal = (typeof oldVal === "string" || typeof rVal === "string") ? String(oldVal) + String(rVal) : oldVal + rVal;
        else if (op === "-=") newVal = oldVal - rVal;
        else if (op === "*=") newVal = oldVal * rVal;
        else if (op === "/=") newVal = oldVal / rVal;
        else if (op === "%=") newVal = oldVal % rVal;

        vars[varName].value    = newVal;
        vars[varName].type     = typeLabel(newVal);
        vars[varName].isMutated = true;

        if (op === "+=" && typeof oldVal === "string") {
          pushSnap(lineNumber, t, "STRING_CONCAT",
            `String concat: '${varName}' was "${oldVal}", appended "${rVal}" → "${newVal}".`,
            { mutatedVar: varName, stringData: { base: oldVal, appended: rVal, result: newVal } });
        } else {
          const typeMap = { "+=": "Add Assign", "-=": "Sub Assign", "*=": "Mul Assign", "/=": "Div Assign", "%=": "Mod Assign", "=": "Assign" };
          pushSnap(lineNumber, t, op === "=" ? "ASSIGNMENT" : "COMPOUND_ASSIGNMENT",
            `${typeMap[op] || "Assignment"}: '${varName}' changed from ${JSON.stringify(oldVal)} → ${JSON.stringify(newVal)}.`,
            { mutatedVar: varName });
        }
        return;
      }
    }

    // ── INCREMENT / DECREMENT ────────────────────────────────────
    const incDecMatch = t.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)(--|[+][+]);?$/) ||
                        t.match(/^(--|[+][+])([a-zA-Z_$][a-zA-Z0-9_$]*);?$/);
    if (incDecMatch) {
      const varName = incDecMatch[1].match(/[a-zA-Z_$]/) ? incDecMatch[1] : incDecMatch[2];
      const op      = incDecMatch[1].match(/[a-zA-Z_$]/) ? incDecMatch[2] : incDecMatch[1];
      if (vars[varName]) {
        const old = vars[varName].value;
        const nv  = op === "++" ? old + 1 : old - 1;
        vars[varName].value = nv;
        vars[varName].isMutated = true;
        pushSnap(lineNumber, t, "INCREMENT_DECREMENT",
          `${op === "++" ? "Incremented" : "Decremented"} '${varName}': ${old} → ${nv}.`,
          { mutatedVar: varName });
      }
      return;
    }

    // ── CONSOLE.LOG ──────────────────────────────────────────────
    const consoleMatch = t.match(/^console\.log\(([\s\S]+)\);?$/);
    if (consoleMatch) {
      const raw = consoleMatch[1];
      // Handle multiple arguments separated by commas
      const args = raw.split(",").map(a => {
        const trimmed = a.trim();
        // Check if it's accessing an object/array by name
        if (objects[trimmed]) return JSON.stringify(objects[trimmed]);
        if (arrays[trimmed]) return JSON.stringify(arrays[trimmed]);
        // Check for object.method() calls
        const methodCall = trimmed.match(/^([a-zA-Z_$]\w*)\.([a-zA-Z_$]\w*)\(([^)]*)\)$/);
        if (methodCall && objects[methodCall[1]]) {
          // e.g. obj.greet()
          return `[method call: ${trimmed}]`;
        }
        const { val } = parseValue(trimmed);
        return val !== undefined ? String(val) : trimmed;
      });
      const out = args.join(" ");
      consoleLogs.push(out);
      pushSnap(lineNumber, t, "OUTPUT",
        `console.log() → printed "${out}" to standard output.`);
      return;
    }

    // ── RETURN STATEMENT ─────────────────────────────────────────
    const returnMatch = t.match(/^return\s+(.*?);?$/);
    if (returnMatch) {
      const { val } = parseValue(returnMatch[1]);
      pushSnap(lineNumber, t, "FUNCTION_RETURN",
        `return ${JSON.stringify(val)} — value returned to caller.`,
        { functionData: { returnValue: val } });
      return; // Will be handled by caller
    }

    // ── STANDALONE FUNCTION CALL ─────────────────────────────────
    const fnCallMatch = t.match(/^([a-zA-Z_$]\w*)\(([^)]*)\);?$/);
    if (fnCallMatch) {
      const fnName = fnCallMatch[1];
      const argStr = fnCallMatch[2];
      if (funcRegistry[fnName]) {
        executeFunction(fnName, argStr, lineNumber);
        return;
      }
    }

    // ── .then() / .catch() ───────────────────────────────────────
    const thenMatch = t.match(/^(.+)\.then\((.+)\);?$/);
    if (thenMatch) {
      pushSnap(lineNumber, t, "PROMISE_THEN",
        `Promise .then() handler registered. Will execute when Promise resolves.`,
        { asyncData: { stage: "then-registered", chain: t } });
      return;
    }
    const catchMatch = t.match(/^(.+)\.catch\((.+)\);?$/);
    if (catchMatch) {
      pushSnap(lineNumber, t, "PROMISE_CATCH",
        `Promise .catch() error handler registered. Will execute if Promise rejects.`,
        { asyncData: { stage: "catch-registered", chain: t } });
      return;
    }

    // ── setTimeout ───────────────────────────────────────────────
    const setTimeoutMatch = t.match(/^setTimeout\((.+),\s*(\d+)\);?$/);
    if (setTimeoutMatch) {
      const delay = setTimeoutMatch[2];
      pushSnap(lineNumber, t, "TIMEOUT_SCHEDULED",
        `setTimeout() scheduled with ${delay}ms delay. Added to Web API timer queue.`,
        { asyncData: { stage: "timeout-scheduled", delay: parseInt(delay, 10) } });
      asyncQueue.push({ lineNumber, t, delay: parseInt(delay, 10) });
      return;
    }

    // ── this.prop = val ──────────────────────────────────────────
    const thisMatch = t.match(/^this\.([a-zA-Z_$]\w*)\s*=\s*(.+?);?$/);
    if (thisMatch) {
      const prop = thisMatch[1];
      const { val } = parseValue(thisMatch[2]);
      pushSnap(lineNumber, t, "THIS_BINDING",
        `this.${prop} = ${JSON.stringify(val)}. Property bound to the current execution context.`,
        { closureData: { type: "this-binding", property: prop, value: val } });
      return;
    }

    // ── .bind() / .call() / .apply() ─────────────────────────────
    const bindMatch = t.match(/^(.+)\.bind\((.+)\);?$/);
    if (bindMatch) {
      pushSnap(lineNumber, t, "THIS_BINDING",
        `.bind(${bindMatch[2]}) — creates new function with '${bindMatch[2]}' as its 'this' context.`,
        { closureData: { type: "bind", context: bindMatch[2] } });
      return;
    }
    const callApplyMatch = t.match(/^(.+)\.(call|apply)\((.+)\);?$/);
    if (callApplyMatch) {
      pushSnap(lineNumber, t, "THIS_BINDING",
        `.${callApplyMatch[2]}(${callApplyMatch[3]}) — explicitly sets 'this' for this invocation.`,
        { closureData: { type: callApplyMatch[2], context: callApplyMatch[3].split(",")[0] } });
      return;
    }

    // ── Closure variable access ──────────────────────────────────
    const closureCall = t.match(/^(?:const|let|var)\s+([a-zA-Z_$]\w*)\s*=\s*([a-zA-Z_$]\w+)\s*\(\s*\);?$/);
    if (closureCall) {
      const resultName = closureCall[1];
      const fn = closureCall[2];
      if (closureEnvs[fn]) {
        const capturedVars = Object.keys(closureEnvs[fn]);
        if (capturedVars.length > 0) {
          const addr = nextAddr();
          vars[resultName] = { name: resultName, value: `[Closure from ${fn}]`, type: "function", memoryAddr: addr, kind: "let", isMutated: false, declaredAtLine: lineNumber };
          pushSnap(lineNumber, t, "CLOSURE_ACCESS",
            `Calling '${fn}()'. This function closes over: [${capturedVars.join(", ")}] from the outer scope.`,
            { mutatedVar: resultName, closureData: { type: "closure-access", fn, capturedVars, env: safeClone(closureEnvs[fn]) } });
          return;
        }
      }
    }

    // ── GENERIC EXPRESSION (fallback) ────────────────────────────
    if (t && !t.startsWith("}") && !t.startsWith("{") && t !== "break;" && t !== "break") {
      pushSnap(lineNumber, t, "EXPRESSION",
        `Executing expression on line ${lineNumber}: ${t}`);
    }
  }

  // ── execute a registered function ──────────────────────────────
  function executeFunction(fnName, argStr, callLine) {
    if (recursionDepth >= MAX_RECURSION) {
      pushSnap(callLine, `${fnName}(${argStr})`, "RECURSION_LIMIT",
        `⚠️ Recursion depth limit (${MAX_RECURSION}) reached for '${fnName}'. Stopping.`,
        { functionData: { name: fnName, error: "max recursion" } });
      return undefined;
    }

    const fnMeta = funcRegistry[fnName];
    if (!fnMeta) return undefined;

    const { params, bodyLines, isAsync } = fnMeta;
    const argVals = argStr.split(",").map(a => {
      const trimmed = a.trim();
      if (!trimmed) return undefined;
      return parseValue(trimmed).val;
    }).filter(v => v !== undefined || argStr.trim() !== "");

    // Save current vars state (for recursion)
    const savedVars = {};
    params.forEach(p => { if (vars[p] !== undefined) savedVars[p] = safeClone(vars[p]); });

    const frame = {
      id: `frame-${fnName}-${snapshots.length}`,
      functionName: `${fnName}(${argStr.trim()})`,
      line: callLine,
      scope: "local",
      locals: {},
    };

    // Bind params
    params.forEach((p, idx) => {
      const val = argVals[idx] !== undefined ? argVals[idx] : undefined;
      frame.locals[p] = val;
      vars[p] = { name: p, value: val, type: typeLabel(val), memoryAddr: nextAddr(), kind: "param", isMutated: false, declaredAtLine: callLine };
    });

    callStack.push(frame);
    recursionDepth++;

    pushSnap(callLine, `${fnName}(${argStr.trim()})`, isAsync ? "ASYNC_FUNCTION_CALL" : "FUNCTION_CALL",
      `Called ${isAsync ? "async " : ""}function '${fnName}' with args: [${argVals.map(v => JSON.stringify(v)).join(", ")}]. New frame pushed onto call stack (depth: ${callStack.length}).`,
      { functionData: { name: fnName, args: argVals, params, frameDepth: callStack.length } });

    // Execute body lines
    let returnValue = undefined;
    for (const { text, lineNum } of bodyLines) {
      const trimmed = text.trim();

      // Check for return statement
      const retMatch = trimmed.match(/^return\s+(.*?);?$/);
      if (retMatch) {
        const retExpr = retMatch[1].trim();

        // Check for recursive call in return
        const recCallMatch = retExpr.match(/^(.+)\s*\*\s*([a-zA-Z_$]\w*)\((.+)\)$/);
        const recCallMatch2 = retExpr.match(/^([a-zA-Z_$]\w*)\((.+)\)\s*\*\s*(.+)$/);
        const simpleRecCall = retExpr.match(/^([a-zA-Z_$]\w*)\((.+)\)$/);

        if (recCallMatch && funcRegistry[recCallMatch[2]]) {
          // e.g., return n * factorial(n - 1)
          const leftVal = resolveExpr(recCallMatch[1]);
          const recResult = executeFunction(recCallMatch[2], recCallMatch[3], lineNum);
          returnValue = leftVal * (recResult ?? 1);
        } else if (recCallMatch2 && funcRegistry[recCallMatch2[1]]) {
          // e.g., return factorial(n - 1) * n
          const recResult = executeFunction(recCallMatch2[1], recCallMatch2[2], lineNum);
          const rightVal = resolveExpr(recCallMatch2[3]);
          returnValue = (recResult ?? 1) * rightVal;
        } else if (simpleRecCall && funcRegistry[simpleRecCall[1]]) {
          // return someFunc(args)
          returnValue = executeFunction(simpleRecCall[1], simpleRecCall[2], lineNum);
        } else {
          const { val } = parseValue(retExpr);
          returnValue = val;
        }

        pushSnap(lineNum, trimmed, "FUNCTION_RETURN",
          `'${fnName}' returning ${JSON.stringify(returnValue)}. Frame popped from call stack.`,
          { functionData: { name: fnName, returnValue, frameDepth: callStack.length } });
        break;
      }

      // Check for if/else branching inside function body
      const ifMatch = trimmed.match(/^if\s*\((.+)\)\s*\{?$/);
      if (ifMatch) {
        const cond = ifMatch[1];
        const result = resolveExpr(cond);
        const taken = Boolean(result);
        pushSnap(lineNum, trimmed, "CONDITIONAL_EVALUATION",
          `Inside '${fnName}': if (${cond}) → ${result}. Branch ${taken ? "✅ TAKEN" : "⏭ SKIPPED"}.`,
          { branchData: { condition: cond, result, taken, type: "if" }, functionData: { name: fnName } });
        continue;
      }

      // Execute other body lines
      executeLine(text, lineNum);
    }

    callStack.pop();
    recursionDepth--;

    // Restore saved vars
    params.forEach(p => {
      if (savedVars[p]) {
        vars[p] = savedVars[p];
      } else {
        delete vars[p];
      }
    });

    return returnValue;
  }

  // ─────────────────────────────────────────────────────────────────
  // MAIN LINE PROCESSING
  // ─────────────────────────────────────────────────────────────────

  let i = 0;

  while (i < lines.length) {
    const lineStr = lines[i];
    const lineNumber = i + 1;
    const t = lineStr.trim();
    i++;

    // skip blank / comment / single-brace lines
    if (!t || t.startsWith("//") || t.startsWith("*") || t.startsWith("/*") || t === "}" || t === "};") {
      continue;
    }

    // ── BRANCHING: if / else if / else ──────────────────────────
    const ifMatch     = t.match(/^if\s*\((.+)\)\s*\{?$/);
    const elseIfMatch = t.match(/^else\s+if\s*\((.+)\)\s*\{?$/);
    const elseMatch   = t.match(/^else\s*\{?$/);
    const switchMatch = t.match(/^switch\s*\((.+)\)\s*\{?$/);
    const caseMatch   = t.match(/^case\s+(.+):\s*$/);
    const defaultMatch = t.match(/^default:\s*$/);

    if (ifMatch || elseIfMatch) {
      const cond   = (ifMatch || elseIfMatch)[1];
      const result = resolveExpr(cond);
      const taken  = Boolean(result);
      const label  = ifMatch ? "if" : "else-if";
      pushSnap(lineNumber, t, "CONDITIONAL_EVALUATION",
        `Evaluated ${label} condition: (${cond}) → ${result}. Branch ${taken ? "✅ TAKEN" : "⏭ SKIPPED"}.`,
        { branchData: { condition: cond, result, taken, type: label } });

      // Collect block body
      if (t.endsWith("{")) {
        const { bodyLines, endIdx } = collectBlock(i);
        if (taken) {
          // Execute body lines
          bodyLines.forEach(({ text, lineNum }) => executeLine(text, lineNum));
        }
        i = endIdx;
      }
      continue;
    }

    if (elseMatch) {
      pushSnap(lineNumber, t, "CONDITIONAL_ELSE",
        `Entered else branch — none of the above conditions were true.`,
        { branchData: { type: "else", taken: true } });

      if (t.endsWith("{")) {
        const { bodyLines, endIdx } = collectBlock(i);
        bodyLines.forEach(({ text, lineNum }) => executeLine(text, lineNum));
        i = endIdx;
      }
      continue;
    }

    if (switchMatch) {
      const expr = switchMatch[1];
      const val  = resolveExpr(expr);
      pushSnap(lineNumber, t, "SWITCH_EVALUATION",
        `Switch expression (${expr}) evaluated to ${JSON.stringify(val)}. Matching case...`,
        { branchData: { type: "switch", expression: expr, value: val } });

      // Collect switch body
      if (t.endsWith("{")) {
        const { bodyLines, endIdx } = collectBlock(i);
        let matched = false;
        let executing = false;

        for (const { text, lineNum } of bodyLines) {
          const caseM = text.trim().match(/^case\s+(.+):\s*$/);
          const defM = text.trim().match(/^default:\s*$/);
          const breakM = text.trim() === "break;" || text.trim() === "break";

          if (caseM) {
            const caseVal = resolveExpr(caseM[1]);
            const isMatch = val === caseVal;
            pushSnap(lineNum, text.trim(), "CASE_CHECK",
              `Checking case ${caseM[1]} (= ${JSON.stringify(caseVal)}) → ${isMatch ? "✅ MATCH" : "⏭ no match"}.`,
              { branchData: { type: "case", value: caseVal, matched: isMatch } });
            if (isMatch) { matched = true; executing = true; }
          } else if (defM) {
            pushSnap(lineNum, text.trim(), "CASE_DEFAULT",
              `Default case reached.`, { branchData: { type: "default" } });
            if (!matched) executing = true;
          } else if (breakM) {
            if (executing) {
              pushSnap(lineNum, text.trim(), "BREAK_STATEMENT",
                `break — exiting switch statement.`);
              executing = false;
            }
          } else if (executing) {
            executeLine(text, lineNum);
          }
        }
        i = endIdx;
      }
      continue;
    }

    if (caseMatch) {
      const caseVal = resolveExpr(caseMatch[1]);
      pushSnap(lineNumber, t, "CASE_CHECK",
        `Checking case ${caseMatch[1]} (= ${JSON.stringify(caseVal)}).`,
        { branchData: { type: "case", value: caseVal } });
      continue;
    }

    if (defaultMatch) {
      pushSnap(lineNumber, t, "CASE_DEFAULT", `Default case.`, { branchData: { type: "default" } });
      continue;
    }

    // ── FOR LOOP ─────────────────────────────────────────────────
    const forMatch = t.match(/^for\s*\(\s*(?:let|var|const)?\s*([a-zA-Z_$]\w*)\s*=\s*(.+?)\s*;\s*(.+?)\s*;\s*(.+?)\s*\)\s*\{?$/);
    if (forMatch) {
      const counter   = forMatch[1];
      const initExpr  = forMatch[2].trim();
      const condStr   = forMatch[3].trim();
      const stepExpr  = forMatch[4].trim();

      let startVal = parseValue(initExpr).val;
      if (typeof startVal !== "number") startVal = resolveExpr(initExpr) ?? 0;

      const addr = nextAddr();
      vars[counter] = { name: counter, value: startVal, type: "number", memoryAddr: addr, kind: "let", isMutated: false, declaredAtLine: lineNumber };

      pushSnap(lineNumber, t, "LOOP_START",
        `for loop started. '${counter}' initialised to ${startVal}. Condition: ${condStr}. Step: ${stepExpr}.`,
        { loopData: { type: "for", counter, startVal, condition: condStr, step: stepExpr } });

      // Collect body
      const { bodyLines, endIdx } = collectBlock(i);
      i = endIdx;

      // Simulate iterations
      let iterCount = 0;
      while (iterCount < MAX_LOOP_ITERS) {
        const condResult = resolveExpr(condStr);
        if (!condResult) break;

        pushSnap(lineNumber, t, "LOOP_ITERATION",
          `Iteration ${iterCount + 1}: ${counter} = ${vars[counter].value}, condition (${condStr}) = ✅ true.`,
          { mutatedVar: counter, loopData: { type: "for", counter, iteration: iterCount + 1, currentVal: vars[counter].value } });

        // Execute body
        bodyLines.forEach(({ text, lineNum }) => executeLine(text, lineNum));

        // Apply step expression
        const stepMatch = stepExpr.match(/^([a-zA-Z_$]\w*)(\+\+|--)$/);
        const stepMatch2 = stepExpr.match(/^(\+\+|--)([a-zA-Z_$]\w*)$/);
        const stepAssign = stepExpr.match(/^([a-zA-Z_$]\w*)\s*([+\-*/%]?)=\s*(.+)$/);

        if (stepMatch) {
          vars[stepMatch[1]].value += stepMatch[2] === "++" ? 1 : -1;
        } else if (stepMatch2) {
          vars[stepMatch2[2]].value += stepMatch2[1] === "++" ? 1 : -1;
        } else if (stepAssign) {
          const sv = parseValue(stepAssign[3]).val;
          const op = stepAssign[2];
          if (op === "+") vars[stepAssign[1]].value += sv;
          else if (op === "-") vars[stepAssign[1]].value -= sv;
          else if (op === "*") vars[stepAssign[1]].value *= sv;
          else vars[stepAssign[1]].value = sv;
        }

        vars[counter].isMutated = true;
        iterCount++;
      }

      pushSnap(lineNumber, t, "LOOP_END",
        `for loop finished after ${iterCount} iteration(s). '${counter}' final value: ${vars[counter].value}.`,
        { loopData: { type: "for", counter, totalIterations: iterCount, finalVal: vars[counter].value } });
      continue;
    }

    // ── WHILE LOOP ───────────────────────────────────────────────
    const whileMatch = t.match(/^while\s*\((.+)\)\s*\{?$/);
    if (whileMatch) {
      const condition = whileMatch[1].trim();
      pushSnap(lineNumber, t, "LOOP_START",
        `while loop started. Condition: (${condition}).`,
        { loopData: { type: "while", condition } });

      const { bodyLines, endIdx } = collectBlock(i);
      i = endIdx;

      let iterCount = 0;
      while (resolveExpr(condition) && iterCount < MAX_LOOP_ITERS) {
        pushSnap(lineNumber, t, "LOOP_ITERATION",
          `Iteration ${iterCount + 1}: condition (${condition}) = ✅ true.`,
          { loopData: { type: "while", condition, iteration: iterCount + 1 } });

        bodyLines.forEach(({ text, lineNum }) => executeLine(text, lineNum));
        iterCount++;
      }

      pushSnap(lineNumber, t, "LOOP_END",
        `while loop ended after ${iterCount} iteration(s). Condition (${condition}) = ❌ false.`,
        { loopData: { type: "while", condition, totalIterations: iterCount } });
      continue;
    }

    // ── DO-WHILE LOOP ────────────────────────────────────────────
    const doMatch = t.match(/^do\s*\{?$/);
    if (doMatch) {
      pushSnap(lineNumber, t, "LOOP_START",
        `do-while loop started. Body executes at least once before condition check.`,
        { loopData: { type: "do-while" } });

      const { bodyLines, endIdx } = collectBlock(i);

      // Find the while condition after the closing brace
      let whileCond = "true";
      let condLineIdx = endIdx;
      if (condLineIdx < lines.length) {
        const whileCondMatch = lines[condLineIdx]?.trim().match(/^}\s*while\s*\((.+)\)\s*;?$/);
        if (whileCondMatch) {
          whileCond = whileCondMatch[1].trim();
          condLineIdx++;
        } else {
          // Check next line for while condition
          const nextWhile = lines[condLineIdx]?.trim().match(/^while\s*\((.+)\)\s*;?$/);
          if (nextWhile) {
            whileCond = nextWhile[1].trim();
            condLineIdx++;
          }
        }
      }
      i = condLineIdx;

      let iterCount = 0;
      let shouldContinue = true;
      while (shouldContinue && iterCount < MAX_LOOP_ITERS) {
        pushSnap(lineNumber, t, "LOOP_ITERATION",
          `do-while iteration ${iterCount + 1}: executing body.`,
          { loopData: { type: "do-while", condition: whileCond, iteration: iterCount + 1 } });

        bodyLines.forEach(({ text, lineNum }) => executeLine(text, lineNum));
        iterCount++;

        shouldContinue = Boolean(resolveExpr(whileCond));
        if (!shouldContinue) {
          pushSnap(lineNumber, `} while (${whileCond});`, "LOOP_CONDITION_CHECK",
            `do-while condition (${whileCond}) = ❌ false. Loop exits.`,
            { loopData: { type: "do-while", condition: whileCond, result: false } });
        }
      }

      pushSnap(lineNumber, t, "LOOP_END",
        `do-while loop ended after ${iterCount} iteration(s).`,
        { loopData: { type: "do-while", condition: whileCond, totalIterations: iterCount } });
      continue;
    }

    // ── FUNCTION DECLARATION ─────────────────────────────────────
    const funcDeclMatch = t.match(/^(?:async\s+)?function\s+([a-zA-Z_$]\w*)\s*\(([^)]*)\)\s*\{?$/);
    if (funcDeclMatch) {
      const fnName  = funcDeclMatch[1];
      const params  = funcDeclMatch[2].split(",").map(p => p.trim()).filter(Boolean);
      const isAsync = t.startsWith("async");

      const { bodyLines, endIdx } = collectBlock(i);
      i = endIdx;

      // Store closure environment (snapshot of vars at declaration time)
      closureEnvs[fnName] = safeClone(vars);

      // Register function for later calls
      funcRegistry[fnName] = { params, bodyLines, isAsync, declLine: lineNumber };

      const addr = nextAddr();
      vars[fnName] = {
        name: fnName, value: `[Function: ${fnName}]`, type: "function",
        memoryAddr: addr, kind: "function", isMutated: false, declaredAtLine: lineNumber,
      };

      pushSnap(lineNumber, t, isAsync ? "ASYNC_FUNCTION_DECLARATION" : "FUNCTION_DECLARATION",
        `${isAsync ? "Async f" : "F"}unction '${fnName}' declared with ${params.length} parameter(s): [${params.join(", ")}].${isAsync ? " Returns a Promise." : ""} Body: ${bodyLines.length} line(s).`,
        { functionData: { name: fnName, params, bodyLineCount: bodyLines.length, isAsync } });
      continue;
    }

    // ── ARROW FUNCTION DECLARATION (const fn = (...) => { ... }) ─
    const arrowAssign = t.match(/^(?:const|let|var)\s+([a-zA-Z_$]\w*)\s*=\s*(?:async\s+)?\(([^)]*)\)\s*=>\s*\{?(.*)$/);
    if (arrowAssign) {
      const fnName  = arrowAssign[1];
      const params  = arrowAssign[2].split(",").map(p => p.trim()).filter(Boolean);
      const isAsync = t.includes("async");
      const inlineBody = arrowAssign[3]?.trim();

      let bodyLines;
      let endIdx = i;

      if (t.endsWith("{")) {
        const block = collectBlock(i);
        bodyLines = block.bodyLines;
        endIdx = block.endIdx;
      } else if (inlineBody && inlineBody !== "{") {
        // Single-expression arrow
        bodyLines = [{ text: `return ${inlineBody}`, lineNum: lineNumber }];
      } else {
        bodyLines = [];
      }
      i = endIdx;

      closureEnvs[fnName] = safeClone(vars);
      funcRegistry[fnName] = { params, bodyLines, isAsync, declLine: lineNumber };

      const addr = nextAddr();
      vars[fnName] = {
        name: fnName, value: `[Function: ${fnName}]`, type: "function",
        memoryAddr: addr, kind: "const", isMutated: false, declaredAtLine: lineNumber,
      };

      pushSnap(lineNumber, t, isAsync ? "ASYNC_FUNCTION_DECLARATION" : "FUNCTION_DECLARATION",
        `Arrow function '${fnName}' declared with params: [${params.join(", ")}].${isAsync ? " (async)" : ""}`,
        { functionData: { name: fnName, params, bodyLineCount: bodyLines.length, isAsync } });
      continue;
    }

    // ── STANDALONE FUNCTION CALL ─────────────────────────────────
    const standaloneCall = t.match(/^([a-zA-Z_$]\w*)\(([^)]*)\);?$/);
    if (standaloneCall && funcRegistry[standaloneCall[1]]) {
      executeFunction(standaloneCall[1], standaloneCall[2], lineNumber);
      continue;
    }

    // ── For all other lines, delegate to executeLine ─────────────
    executeLine(lineStr, lineNumber);
  }

  // ── flush async queue ───────────────────────────────────────────
  asyncQueue.forEach(({ lineNumber: ln, t: txt, delay }) => {
    pushSnap(ln, txt, "TIMEOUT_EXECUTED",
      `⏱ setTimeout callback executed after ${delay}ms delay. Moved from timer queue to call stack.`,
      { asyncData: { stage: "timeout-executed", delay } });
  });

  // set total steps
  const total = snapshots.length;
  snapshots.forEach(s => { s.totalSteps = total; });

  return snapshots;
}
