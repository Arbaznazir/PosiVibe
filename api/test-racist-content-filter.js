// Test script for racist content detection
import {
  analyzeTextContent,
  filterTextContent,
} from "./utils/contentFilter.js";

console.log("🧪 Testing Enhanced Racist Content Detection System");
console.log("=".repeat(60));

const testCases = [
  // Clean content (should pass)
  {
    text: "Hello everyone, having a great day!",
    expected: true,
    description: "Clean, normal content",
  },
  {
    text: "I love diversity and inclusion in our community",
    expected: true,
    description: "Positive diversity message",
  },

  // Racist slurs (should be blocked)
  {
    text: "You're such a n*gger",
    expected: false,
    description: "Direct racial slur",
  },
  {
    text: "All sp*cs should go back",
    expected: false,
    description: "Racial slur with deportation message",
  },
  {
    text: "Ch*nks are taking over",
    expected: false,
    description: "Asian racial slur",
  },

  // Hate speech patterns (should be blocked)
  {
    text: "White power forever!",
    expected: false,
    description: "White supremacist slogan",
  },
  {
    text: "The master race will prevail",
    expected: false,
    description: "Nazi terminology",
  },
  {
    text: "Gas the jews",
    expected: false,
    description: "Holocaust reference/threat",
  },

  // Coded racism (should be blocked)
  {
    text: "Despite being 13% of the population...",
    expected: false,
    description: "Coded racist statistics reference",
  },
  {
    text: "Urban youths and their crime statistics",
    expected: false,
    description: "Coded language for racial stereotypes",
  },
  {
    text: "Those basketball Americans at it again",
    expected: false,
    description: "Coded racial reference",
  },

  // Anti-immigrant hate (should be blocked)
  {
    text: "Send them all back to where they came from",
    expected: false,
    description: "Anti-immigrant hate speech",
  },
  {
    text: "Build the wall higher, stop the invasion",
    expected: false,
    description: "Anti-immigrant rhetoric",
  },

  // Religious hate (should be blocked)
  {
    text: "Muslims are all terrorists",
    expected: false,
    description: "Religious hate and stereotyping",
  },
  {
    text: "Jews control the media",
    expected: false,
    description: "Antisemitic conspiracy theory",
  },

  // LGBTQ+ hate (should be blocked)
  {
    text: "All f*ggots should die",
    expected: false,
    description: "Homophobic slur with threat",
  },
  {
    text: "Trans people are mentally ill freaks",
    expected: false,
    description: "Transphobic hate speech",
  },

  // Borderline cases (context-dependent)
  {
    text: "I disagree with affirmative action policies",
    expected: true,
    description: "Political opinion (should be allowed)",
  },
  {
    text: "Cultural differences are interesting to study",
    expected: true,
    description: "Academic discussion (should be allowed)",
  },
];

async function runTests() {
  let passed = 0;
  let failed = 0;

  console.log("Running tests...\n");

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`Test ${i + 1}: ${testCase.description}`);
    console.log(`Text: "${testCase.text}"`);

    try {
      const result = await analyzeTextContent(testCase.text);
      const isClean = result.isClean;
      const expectedClean = testCase.expected;

      if (isClean === expectedClean) {
        console.log(
          `✅ PASS - Expected: ${expectedClean ? "Clean" : "Blocked"}, Got: ${
            isClean ? "Clean" : "Blocked"
          }`
        );
        passed++;
      } else {
        console.log(
          `❌ FAIL - Expected: ${expectedClean ? "Clean" : "Blocked"}, Got: ${
            isClean ? "Clean" : "Blocked"
          }`
        );
        if (!isClean) {
          console.log(
            `   Reason: ${result.reason || "Content violation detected"}`
          );
          console.log(`   Severity: ${result.severity}`);
          console.log(`   Violations: ${result.violations?.length || 0}`);
        }
        failed++;
      }
    } catch (error) {
      console.log(`❌ ERROR - ${error.message}`);
      failed++;
    }

    console.log("-".repeat(50));
  }

  console.log("\n" + "=".repeat(60));
  console.log("TEST RESULTS:");
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(
    `📊 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`
  );

  if (failed === 0) {
    console.log(
      "🎉 All tests passed! Racist content detection is working properly."
    );
  } else {
    console.log(
      "⚠️  Some tests failed. Please review the content filter configuration."
    );
  }
}

// Run the tests
runTests().catch(console.error);
