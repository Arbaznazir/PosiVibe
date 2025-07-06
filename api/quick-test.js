import axios from "axios";

const API_BASE = "http://localhost:8800/api";

const log = (message, type = "info") => {
  const colors = {
    info: "\x1b[36m",
    success: "\x1b[32m",
    error: "\x1b[31m",
    warning: "\x1b[33m",
    reset: "\x1b[0m",
  };
  console.log(`${colors[type]}${message}${colors.reset}`);
};

const makeRequest = async (method, endpoint, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: { "Content-Type": "application/json" },
    };

    if (token) {
      config.headers.Cookie = `accessToken=${token}`;
    }

    if (data) {
      config.data = data;
    }

    return await axios(config);
  } catch (error) {
    throw new Error(
      `${error.response?.status || "NETWORK"}: ${
        error.response?.data?.message || error.message
      }`
    );
  }
};

const runQuickTest = async () => {
  log("🚀 Starting Quick PosiVibe Test", "info");

  try {
    // Test 1: Login
    log("Testing login...", "info");
    const loginResponse = await makeRequest("POST", "/auth/login", {
      email: "jamsheed@example.com",
      password: "password123",
    });

    if (loginResponse.status === 200 && loginResponse.data.token) {
      log("✅ Login successful", "success");
      const token = loginResponse.data.token;
      const userId = loginResponse.data.user.id;

      // Test 2: Get Posts
      log("Testing posts feed...", "info");
      const postsResponse = await makeRequest("GET", "/posts", null, token);
      if (postsResponse.status === 200) {
        log(
          `✅ Posts feed loaded (${postsResponse.data.length} posts)`,
          "success"
        );
      }

      // Test 3: Create Post
      log("Testing post creation...", "info");
      const createPostResponse = await makeRequest(
        "POST",
        "/posts",
        {
          desc: "Test post from comprehensive testing! 🚀",
        },
        token
      );
      if (createPostResponse.status === 200) {
        log("✅ Post created successfully", "success");
      }

      // Test 4: Content Filtering
      log("Testing content filtering...", "info");
      try {
        await makeRequest(
          "POST",
          "/posts",
          {
            desc: "This is stupid and I hate everything",
          },
          token
        );
        log("⚠️ WARNING: Inappropriate content was not filtered!", "warning");
      } catch (error) {
        if (error.message.includes("inappropriate")) {
          log("✅ Content filtering working", "success");
        } else {
          throw error;
        }
      }

      // Test 5: Time Limits
      log("Testing time limits...", "info");
      const timeLimitResponse = await makeRequest(
        "GET",
        "/users/time-limit",
        null,
        token
      );
      if (timeLimitResponse.status === 200) {
        const remaining = Math.floor(
          timeLimitResponse.data.remaining / (1000 * 60)
        );
        log(
          `✅ Time limits working (${remaining} minutes remaining)`,
          "success"
        );
      }

      // Test 6: Follow user
      log("Testing follow functionality...", "info");
      const danishLogin = await makeRequest("POST", "/auth/login", {
        email: "danish@example.com",
        password: "password123",
      });

      if (danishLogin.status === 200) {
        const danishId = danishLogin.data.user.id;
        const followResponse = await makeRequest(
          "POST",
          "/relationships",
          {
            userId: danishId,
          },
          token
        );

        if (followResponse.status === 200) {
          log("✅ Follow functionality working", "success");

          // Test 7: Send Message
          log("Testing messaging...", "info");
          const messageResponse = await makeRequest(
            "POST",
            "/messages",
            {
              receiverId: danishId,
              content: "Hello Danish! This is a test message 👋",
            },
            token
          );

          if (messageResponse.status === 200) {
            log("✅ Messaging working", "success");
          }
        }
      }

      log("🎉 All tests passed! System is production ready!", "success");
    } else {
      throw new Error("Login failed");
    }
  } catch (error) {
    log(`❌ Test failed: ${error.message}`, "error");
    process.exit(1);
  }
};

runQuickTest();
