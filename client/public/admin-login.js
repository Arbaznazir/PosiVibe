// Admin login helper - run this in browser console
const loginAsAdmin = async () => {
  try {
    console.log("🔐 Logging in as admin...");

    const response = await fetch("http://localhost:8800/api/auth/login", {
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
