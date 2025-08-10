// Admin login helper - run this in browser console
const loginAsAdmin = async () => {
  try {
    console.log("🔐 Logging in as admin...");

    // Function to get the API base URL
    const getApiBaseUrl = () => {
      // If we're on a phone/different device, use the network IP
      if (window.location.hostname !== 'localhost') {
        return `http://${window.location.hostname}:8800/api`;
      }
      // Fallback to localhost
      return "http://localhost:8800/api";
    };
    
    const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        username: "admin",
        password: "admin123",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }

    const userData = await response.json();
    console.log("✅ Login successful!", userData);

    // Format user data to match frontend expectations
    const userToStore = {
      ...userData,
      id: userData._id, // Ensure id field exists
      token:
        response.headers.get("Authorization")?.split(" ")[1] || userData.token,
    };

    // Store user data in localStorage
    localStorage.setItem("user", JSON.stringify(userToStore));
    console.log("✅ User data stored in localStorage");

    // Redirect to admin panel
    window.location.href = "/app/admin";
  } catch (error) {
    console.error("❌ Login error:", error.message);
    alert("Login failed: " + error.message);
  }
};

// Instructions
console.log("🎯 To login as admin, run: loginAsAdmin()");
window.loginAsAdmin = loginAsAdmin;
