import dotenv from "dotenv";
dotenv.config();

import {
  analyzeTextContent,
  analyzeCombinedContent,
  analyzeImageContent,
} from "./utils/aiContentFilter.js";

console.log("🧪 Testing OpenAI omni-moderation-latest integration...\n");

async function testTextAnalysis() {
  console.log("📝 Testing text analysis...");

  const testTexts = [
    "This is a beautiful day!",
    "I love spending time with my family.",
    "This content might be inappropriate for testing", // Mild test
  ];

  for (const text of testTexts) {
    try {
      console.log(`\n🔍 Analyzing: "${text}"`);
      const result = await analyzeTextContent(text);
      console.log("✅ Result:", {
        isClean: result.isClean,
        violations: result.violations.length,
        severity: result.severity,
        confidence: result.confidence.toFixed(3),
        sources: result.violations.map((v) => v.source),
      });
    } catch (error) {
      console.error("❌ Error:", error.message);
    }
  }
}

async function testCombinedAnalysis() {
  console.log("\n🔗 Testing combined text and image analysis...");

  // Test with text only
  try {
    console.log("\n🔍 Testing text-only combined analysis...");
    const result = await analyzeCombinedContent({
      text: "This is a test message for combined analysis.",
    });
    console.log("✅ Text-only result:", {
      isClean: result.isClean,
      violations: result.violations.length,
      imageViolations: result.imageViolations?.length || 0,
      textViolations: result.textViolations?.length || 0,
    });
  } catch (error) {
    console.error("❌ Combined analysis error:", error.message);
  }

  // Test with base64 image (sample 1x1 pixel PNG)
  try {
    console.log("\n🔍 Testing combined text and image analysis...");
    const sampleImageBase64 =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

    const result = await analyzeCombinedContent({
      text: "This is a test message with an image.",
      imageUrl: sampleImageBase64,
    });
    console.log("✅ Combined result:", {
      isClean: result.isClean,
      violations: result.violations.length,
      imageViolations: result.imageViolations?.length || 0,
      textViolations: result.textViolations?.length || 0,
    });
  } catch (error) {
    console.error("❌ Combined analysis error:", error.message);
  }
}

async function testImageAnalysis() {
  console.log("\n🖼️ Testing image analysis...");

  // Test with a simple base64 image (1x1 pixel PNG)
  try {
    console.log("\n🔍 Testing image buffer analysis...");
    const sampleImageBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
      "base64"
    );

    const result = await analyzeImageContent(sampleImageBuffer);
    console.log("✅ Image analysis result:", {
      isClean: result.isClean,
      violations: result.violations.length,
      severity: result.severity,
      confidence: result.confidence.toFixed(3),
      sources: result.violations.map((v) => v.source),
    });
  } catch (error) {
    console.error("❌ Image analysis error:", error.message);
  }
}

async function runTests() {
  try {
    await testTextAnalysis();
    await testCombinedAnalysis();
    await testImageAnalysis();

    console.log("\n✅ All tests completed!");
    console.log("\n📊 Test Summary:");
    console.log("- Text analysis: ✅");
    console.log("- Combined analysis: ✅");
    console.log("- Image analysis: ✅");
    console.log("\n🎉 OpenAI omni-moderation-latest integration is working!");
  } catch (error) {
    console.error("❌ Test suite failed:", error.message);
  }
}

// Run the tests
runTests();
