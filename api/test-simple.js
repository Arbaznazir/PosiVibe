// Simple test for normal greetings
import { analyzeTextContent } from "./utils/contentFilter.js";

console.log("🧪 Testing Normal Greetings and Content");
console.log("=".repeat(40));

const testCases = [
  "hiiii",
  "heyyyy",
  "hello",
  "woooow",
  "yesss",
  "byeee",
  "thanksss",
  "hahaha",
  "omggg",
  "nooo",
  "hi there",
  "hey everyone",
  "hello world",
  "having a great day",
  "love this post",
];

async function testGreetings() {
  console.log("Testing normal social media expressions...\n");

  for (const text of testCases) {
    try {
      const result = await analyzeTextContent(text);
      const status = result.isClean ? "✅ ALLOWED" : "❌ BLOCKED";
      console.log(`${status} - "${text}"`);

      if (!result.isClean) {
        console.log(`   Reason: ${result.reason || "Content violation"}`);
        console.log(`   Severity: ${result.severity}`);
      }
    } catch (error) {
      console.log(`❌ ERROR - "${text}": ${error.message}`);
    }
  }

  console.log("\n" + "=".repeat(40));
  console.log("If all greetings show ✅ ALLOWED, the fix worked!");
}

testGreetings().catch(console.error);
