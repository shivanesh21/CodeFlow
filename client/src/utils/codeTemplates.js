export const CODE_TEMPLATES = {
  javascript: {
    name: "JavaScript (Node.js)",
    defaultCode: `// CodeFlow Interactive Execution - JavaScript
function greet(name) {
    return \`Hello, \${name}! Welcome to CodeFlow.\`;
}

console.log(greet("Developer"));

const numbers = [1, 2, 3, 4, 5];
const squared = numbers.map(n => n * n);
console.log("Squared Numbers:", squared);
`,
  },
  python: {
    name: "Python 3",
    defaultCode: `# CodeFlow Interactive Execution - Python 3
def greet(name):
    return f"Hello, {name}! Welcome to CodeFlow."

print(greet("Developer"))

numbers = [1, 2, 3, 4, 5]
squared = [n ** 2 for n in numbers]
print("Squared Numbers:", squared)
`,
  },
  java: {
    name: "Java",
    defaultCode: `// CodeFlow Interactive Execution - Java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, Developer! Welcome to CodeFlow.");
        
        int[] numbers = {1, 2, 3, 4, 5};
        System.out.print("Numbers: ");
        for (int n : numbers) {
            System.out.print(n + " ");
        }
        System.out.println();
    }
}
`,
  },
  cpp: {
    name: "C++",
    defaultCode: `// CodeFlow Interactive Execution - C++
#include <iostream>
#include <vector>

int main() {
    std::cout << "Hello, Developer! Welcome to CodeFlow." << std::endl;
    
    std::vector<int> numbers = {1, 2, 3, 4, 5};
    std::cout << "Numbers: ";
    for (int n : numbers) {
        std::cout << n << " ";
    }
    std::cout << std::endl;
    
    return 0;
}
`,
  },
  c: {
    name: "C",
    defaultCode: `// CodeFlow Interactive Execution - C
#include <stdio.stdio.h>

int main() {
    printf("Hello, Developer! Welcome to CodeFlow.\\n");
    return 0;
}
`,
  },
};
