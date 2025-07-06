import dotenv from "dotenv";
dotenv.config();

import OpenAI from "openai";

console.log("🧪 Testing OpenAI omni-moderation-latest...\n");

async function testOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY not found in environment variables");
    return;
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log("✅ OpenAI client initialized");

    // Test 1: Simple text moderation
    console.log("\n📝 Testing text moderation...");
    const textResponse = await openai.moderations.create({
      model: "omni-moderation-latest",
      input: "This is a test message for content moderation.",
    });

    console.log("✅ Text moderation result:", {
      flagged: textResponse.results[0].flagged,
      categories: Object.keys(textResponse.results[0].categories).filter(
        (key) => textResponse.results[0].categories[key]
      ),
    });

    // Test 2: Image moderation with base64
    console.log("\n🖼️ Testing image moderation...");
    const sampleImageBase64 =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

    const imageResponse = await openai.moderations.create({
      model: "omni-moderation-latest",
      input: [
        {
          type: "image_url",
          image_url: {
            url: sampleImageBase64,
          },
        },
      ],
    });

    console.log("✅ Image moderation result:", {
      flagged: imageResponse.results[0].flagged,
      categories: Object.keys(imageResponse.results[0].categories).filter(
        (key) => imageResponse.results[0].categories[key]
      ),
      appliedInputTypes: imageResponse.results[0].category_applied_input_types,
    });

    // Test 3: Combined text and image moderation
    console.log("\n🔗 Testing combined moderation...");
    const combinedResponse = await openai.moderations.create({
      model: "omni-moderation-latest",
      input: [
        {
          type: "text",
          text: "This is a test message with an image.",
        },
        {
          type: "image_url",
          image_url: {
            url: sampleImageBase64,
          },
        },
      ],
    });

    console.log("✅ Combined moderation result:", {
      flagged: combinedResponse.results[0].flagged,
      categories: Object.keys(combinedResponse.results[0].categories).filter(
        (key) => combinedResponse.results[0].categories[key]
      ),
      appliedInputTypes:
        combinedResponse.results[0].category_applied_input_types,
    });

    console.log("\n🎉 All OpenAI omni-moderation tests passed!");
  } catch (error) {
    console.error("❌ OpenAI test failed:", error.message);
    if (error.status) {
      console.error("Status:", error.status);
    }
  }
}

testOpenAI();
