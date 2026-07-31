/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║   CodeFlow – Concept Preset Library                             ║
 * ║   Sample code snippets for each visualizable JS concept         ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

export const CONCEPT_PRESETS = {
  javascript: {
    level1: {
      label: "Level 1: Variables & Primitives",
      code: `let name = "Alice";
let age = 25;
const PI = 3.14159;
let isStudent = true;
let score = age * 2;
console.log(name);
console.log(score);`,
    },
    level2: {
      label: "Level 2: Type Coercion & Operators",
      code: `let x = 10;
let y = 3;
let sum = x + y;
let product = x * y;
x += 5;
y--;
let result = x % y;
console.log(sum);
console.log(product);
console.log(result);`,
    },
    level3: {
      label: "Level 3: Branching (if/else/switch)",
      code: `let temperature = 32;
let weather = "unknown";

if (temperature > 30) {
  weather = "hot";
  console.log("It's hot outside!");
} else if (temperature > 20) {
  weather = "warm";
  console.log("Nice weather!");
} else {
  weather = "cold";
  console.log("Bring a jacket!");
}

let grade = 85;
let letter = grade >= 90 ? "A" : "B";
console.log(letter);`,
    },
    level4: {
      label: "Level 4: Loops (for, while, do-while)",
      code: `let total = 0;
for (let i = 1; i < 6; i++) {
  total += i;
  console.log(total);
}

let count = 3;
while (count > 0) {
  console.log(count);
  count--;
}

let n = 1;
do {
  console.log(n);
  n++;
} while (n <= 3);`,
    },
    level5: {
      label: "Level 5: Functions & Recursion",
      code: `function add(a, b) {
  let sum = a + b;
  return sum;
}

let result = add(3, 7);
console.log(result);

function factorial(n) {
  if (n <= 1) {
    return 1;
  }
  return n * factorial(n - 1);
}

let fact5 = factorial(5);
console.log(fact5);`,
    },
    level6: {
      label: "Level 6: Strings & Methods",
      code: `let greeting = "Hello, World!";
let upper = greeting.toUpperCase();
let lower = greeting.toLowerCase();
let sliced = greeting.slice(0, 5);
let len = greeting.length;
let found = greeting.indexOf("World");
let replaced = greeting.replace("World", "CodeFlow");

let first = "Hello";
let second = "World";
let joined = first + " " + second;

console.log(upper);
console.log(replaced);
console.log(joined);`,
    },
    level7: {
      label: "Level 7: Objects & Arrays",
      code: `let fruits = ["apple", "banana", "cherry"];
fruits.push("date");
let removed = fruits.pop();
console.log(fruits);

let person = { name: "Alice", age: 25, city: "NYC" };
person.age = 26;
person.email = "alice@example.com";
console.log(person.name);`,
    },
    level8: {
      label: "Level 8: Async / Promises / await",
      code: `let status = "starting";
console.log(status);

let myPromise = new Promise((resolve) => resolve("done"));
status = "waiting";

setTimeout(function() { console.log("timer fired"); }, 1000);

async function fetchData() {
  let data = await myPromise;
  console.log(data);
  return data;
}

fetchData();
console.log("after fetchData call");`,
    },
    level9: {
      label: "Level 9: Closures & this",
      code: `function makeCounter() {
  let count = 0;
  function increment() {
    count++;
    return count;
  }
  return increment;
}

let counter = makeCounter();

let obj = { name: "Alice", greet: function() { return this.name; } };
console.log(obj.greet());`,
    },
  },
  python: {
    level1: {
      label: "Level 1: Variables & Primitives",
      code: `name = "Alice"
age = 25
PI = 3.14159
is_student = True
score = age * 2
print(name)
print(score)`,
    },
  },
  java: {
    level1: {
      label: "Level 1: Variables & Primitives",
      code: `String name = "Alice";
int age = 25;
double PI = 3.14159;
boolean isStudent = true;
int score = age * 2;
System.out.println(name);
System.out.println(score);`,
    },
  },
  cpp: {
    level1: {
      label: "Level 1: Variables & Primitives",
      code: `#include <iostream>
using namespace std;

int main() {
    string name = "Alice";
    int age = 25;
    double PI = 3.14159;
    bool isStudent = true;
    int score = age * 2;
    cout << name << endl;
    cout << score << endl;
    return 0;
}`,
    },
  },
};
