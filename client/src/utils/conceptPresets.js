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
      label: "Level 7: Array Data Structure",
      code: `// Array Visualization - Contiguous Memory & Operations
let arr = [10, 20, 30];

// Push element to end
arr.push(40);
arr.push(50);

// Modify element at index 2
arr[2] = 99;

// Unshift element to front
arr.unshift(5);

// Pop element from end
let popped = arr.pop();
console.log("Popped element:", popped);

// Shift element from front
let shifted = arr.shift();
console.log("Shifted element:", shifted);

console.log("Final Array:", arr);`,
    },
    level8: {
      label: "Level 8: Stack Data Structure (LIFO)",
      code: `// Stack Data Structure - Last In, First Out (LIFO)
let stack = [];

// Push items onto top of stack
stack.push(10);
stack.push(20);
stack.push(30);
console.log("Stack after pushes:", stack);

// Peek top element
let topElement = stack[stack.length - 1];
console.log("Top element:", topElement);

// Pop items from top of stack
let popped1 = stack.pop();
console.log("Popped from stack:", popped1);

let popped2 = stack.pop();
console.log("Popped from stack:", popped2);

// Push new item
stack.push(99);
console.log("Final Stack state:", stack);`,
    },
    level9: {
      label: "Level 9: Queue Data Structure (FIFO)",
      code: `// Queue Data Structure - First In, First Out (FIFO)
let queue = [];

// Enqueue items to the rear of queue
queue.push("Order #101");
queue.push("Order #102");
queue.push("Order #103");
console.log("Queue after enqueues:", queue);

// Peek front element
let frontOrder = queue[0];
console.log("Front order:", frontOrder);

// Dequeue items from the front of queue
let served1 = queue.shift();
console.log("Served (Dequeued):", served1);

let served2 = queue.shift();
console.log("Served (Dequeued):", served2);

// Enqueue new order to rear
queue.push("Order #104");
console.log("Final Queue state:", queue);`,
    },
    level10: {
      label: "Level 10: Objects & References",
      code: `let person = { name: "Alice", age: 25, city: "NYC" };
person.age = 26;
person.email = "alice@example.com";
console.log(person.name);`,
    },
    level11: {
      label: "Level 11: Async / Promises / await",
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
    level12: {
      label: "Level 12: Closures & this",
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
    level7: {
      label: "Level 7: Array / List Data Structure",
      code: `# Python List (Array) Data Structure
arr = [10, 20, 30]
arr.append(40)
arr.append(50)
arr[2] = 99
popped = arr.pop()
print("Popped:", popped)
print("Final List:", arr)`,
    },
    level8: {
      label: "Level 8: Stack (LIFO)",
      code: `# Python Stack Implementation (LIFO)
stack = []
stack.append(10)
stack.append(20)
stack.append(30)
top_item = stack[-1]
popped_item = stack.pop()
print("Top:", top_item)
print("Popped:", popped_item)
print("Stack:", stack)`,
    },
    level9: {
      label: "Level 9: Queue (FIFO)",
      code: `# Python Queue Implementation (FIFO)
queue = []
queue.append("Task A")
queue.append("Task B")
queue.append("Task C")
front_item = queue[0]
dequeued_item = queue.pop(0)
print("Front:", front_item)
print("Dequeued:", dequeued_item)
print("Queue:", queue)`,
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
    level7: {
      label: "Level 7: Array Operations",
      code: `int[] arr = {10, 20, 30, 40, 50};
arr[2] = 99;
System.out.println(arr[2]);`,
    },
    level8: {
      label: "Level 8: Stack (LIFO)",
      code: `int[] stack = {10, 20, 30};
int top = stack[stack.length - 1];
System.out.println("Top: " + top);`,
    },
    level9: {
      label: "Level 9: Queue (FIFO)",
      code: `int[] queue = {10, 20, 30};
int front = queue[0];
System.out.println("Front: " + front);`,
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
    level7: {
      label: "Level 7: Array Operations",
      code: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> arr = {10, 20, 30};
    arr.push_back(40);
    arr[2] = 99;
    arr.pop_back();
    return 0;
}`,
    },
    level8: {
      label: "Level 8: Stack (LIFO)",
      code: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> stack;
    stack.push_back(10);
    stack.push_back(20);
    stack.push_back(30);
    int top = stack.back();
    stack.pop_back();
    return 0;
}`,
    },
    level9: {
      label: "Level 9: Queue (FIFO)",
      code: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> queue;
    queue.push_back(10);
    queue.push_back(20);
    int front = queue.front();
    queue.erase(queue.begin());
    return 0;
}`,
    },
  },
  c: {
    level1: {
      label: "Level 1: Variables & Primitives",
      code: `#include <stdio.h>

int main() {
    char name[] = "Alice";
    int age = 25;
    double pi = 3.14159;
    int score = age * 2;
    printf("%s\\n", name);
    printf("%d\\n", score);
    return 0;
}`,
    },
    level7: {
      label: "Level 7: Array Operations",
      code: `#include <stdio.h>

int main() {
    int arr[] = {10, 20, 30, 40, 50};
    arr[2] = 99;
    printf("%d\\n", arr[2]);
    return 0;
}`,
    },
    level8: {
      label: "Level 8: Stack (LIFO)",
      code: `#include <stdio.h>

int main() {
    int stack[5];
    int top = -1;
    stack[++top] = 10;
    stack[++top] = 20;
    stack[++top] = 30;
    printf("Top: %d\\n", stack[top]);
    top--;
    return 0;
}`,
    },
    level9: {
      label: "Level 9: Queue (FIFO)",
      code: `#include <stdio.h>

int main() {
    int queue[] = {10, 20, 30};
    int front = 0;
    printf("Front: %d\\n", queue[front]);
    front++;
    return 0;
}`,
    },
  },
};
