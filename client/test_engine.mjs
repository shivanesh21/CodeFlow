// Quick smoke test for the trace engine
import { generateJsSnapshots } from './src/utils/jsTraceEngine.js';

// Test 1: Loops
console.log('\n=== TEST 1: FOR LOOP ===');
const loopSnaps = generateJsSnapshots(`let total = 0;
for (let i = 1; i < 4; i++) {
  total += i;
  console.log(total);
}`);
console.log(`Snapshots: ${loopSnaps.length}`);
const loopConcepts = loopSnaps.map(s => s.conceptType);
console.log('Concepts:', loopConcepts.join(', '));
const hasLoopIter = loopConcepts.includes('LOOP_ITERATION');
const hasLoopEnd = loopConcepts.includes('LOOP_END');
console.log(`✅ LOOP_ITERATION: ${hasLoopIter}, LOOP_END: ${hasLoopEnd}`);

// Test 2: Functions & Recursion
console.log('\n=== TEST 2: FUNCTION CALL ===');
const fnSnaps = generateJsSnapshots(`function add(a, b) {
  let sum = a + b;
  return sum;
}
let result = add(3, 7);
console.log(result);`);
console.log(`Snapshots: ${fnSnaps.length}`);
const fnConcepts = fnSnaps.map(s => s.conceptType);
console.log('Concepts:', fnConcepts.join(', '));
const hasFnCall = fnConcepts.includes('FUNCTION_CALL');
const hasFnReturn = fnConcepts.includes('FUNCTION_RETURN');
console.log(`✅ FUNCTION_CALL: ${hasFnCall}, FUNCTION_RETURN: ${hasFnReturn}`);
// Check result value
const resultSnap = fnSnaps.find(s => s.variables?.result);
console.log(`Result variable value: ${resultSnap?.variables?.result?.value}`);

// Test 3: Recursion
console.log('\n=== TEST 3: RECURSION ===');
const recSnaps = generateJsSnapshots(`function factorial(n) {
  if (n <= 1) {
    return 1;
  }
  return n * factorial(n - 1);
}
let fact = factorial(4);`);
console.log(`Snapshots: ${recSnaps.length}`);
const recConcepts = recSnaps.map(s => s.conceptType);
console.log('Concepts:', recConcepts.join(', '));
const callCount = recConcepts.filter(c => c === 'FUNCTION_CALL').length;
const returnCount = recConcepts.filter(c => c === 'FUNCTION_RETURN').length;
console.log(`✅ FUNCTION_CALLs: ${callCount}, FUNCTION_RETURNs: ${returnCount}`);
// Check call stack depth
const maxStackDepth = Math.max(...recSnaps.map(s => s.callStack?.length || 0));
console.log(`Max call stack depth: ${maxStackDepth}`);

// Test 4: Objects & Arrays
console.log('\n=== TEST 4: OBJECTS & ARRAYS ===');
const objSnaps = generateJsSnapshots(`let fruits = ["apple", "banana"];
fruits.push("cherry");
let person = { name: "Alice", age: 25 };
person.age = 26;`);
console.log(`Snapshots: ${objSnaps.length}`);
const objConcepts = objSnaps.map(s => s.conceptType);
console.log('Concepts:', objConcepts.join(', '));
const hasArray = objConcepts.includes('ARRAY_DECLARATION');
const hasObj = objConcepts.includes('OBJECT_CREATION');
const hasArrMethod = objConcepts.includes('ARRAY_METHOD');
const hasPropAssign = objConcepts.includes('PROPERTY_ASSIGNMENT');
console.log(`✅ ARRAY: ${hasArray}, OBJECT: ${hasObj}, ARR_METHOD: ${hasArrMethod}, PROP_ASSIGN: ${hasPropAssign}`);
// Check heap content
const lastObjSnap = objSnaps[objSnaps.length - 1];
console.log('Heap entries:', Object.keys(lastObjSnap.heap).length);
console.log('Objects:', Object.keys(lastObjSnap.objects));
console.log('Arrays:', Object.keys(lastObjSnap.arrays));

// Test 5: String Methods
console.log('\n=== TEST 5: STRING METHODS ===');
const strSnaps = generateJsSnapshots(`let greeting = "Hello, World!";
let upper = greeting.toUpperCase();
let sliced = greeting.slice(0, 5);
let joined = "Hello" + " " + "World";`);
console.log(`Snapshots: ${strSnaps.length}`);
const strConcepts = strSnaps.map(s => s.conceptType);
console.log('Concepts:', strConcepts.join(', '));
const hasStrMethod = strConcepts.includes('STRING_METHOD');
const hasStrConcat = strConcepts.includes('STRING_CONCAT');
console.log(`✅ STRING_METHOD: ${hasStrMethod}, STRING_CONCAT: ${hasStrConcat}`);

// Test 6: Async
console.log('\n=== TEST 6: ASYNC ===');
const asyncSnaps = generateJsSnapshots(`let p = new Promise((resolve) => resolve("done"));
setTimeout(function() { console.log("timer"); }, 1000);
async function fetchData() {
  let data = await p;
  return data;
}
fetchData();`);
console.log(`Snapshots: ${asyncSnaps.length}`);
const asyncConcepts = asyncSnaps.map(s => s.conceptType);
console.log('Concepts:', asyncConcepts.join(', '));
const hasPromise = asyncConcepts.includes('PROMISE_CREATION');
const hasTimeout = asyncConcepts.includes('TIMEOUT_SCHEDULED');
const hasAsyncFn = asyncConcepts.includes('ASYNC_FUNCTION_DECLARATION');
console.log(`✅ PROMISE: ${hasPromise}, TIMEOUT: ${hasTimeout}, ASYNC_FN: ${hasAsyncFn}`);

// Test 7: do-while
console.log('\n=== TEST 7: DO-WHILE ===');
const doSnaps = generateJsSnapshots(`let n = 1;
do {
  console.log(n);
  n++;
} while (n <= 3);`);
console.log(`Snapshots: ${doSnaps.length}`);
const doConcepts = doSnaps.map(s => s.conceptType);
console.log('Concepts:', doConcepts.join(', '));
const hasDoWhile = doConcepts.some(c => c.includes('LOOP'));
console.log(`✅ Has loop concepts: ${hasDoWhile}`);

console.log('\n=== ALL TESTS COMPLETE ===');
