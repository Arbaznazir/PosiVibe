import { io } from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.onlineUsers = new Set();
  }

  getTokenFromStorage() {
    // First try to get token from localStorage
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (user?.token) {
        return user.token;
      }
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
    }

    // Fallback to cookies
    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (name === "accessToken") {
        return value;
      }
    }
    return null;
  }

  connect(token = null) {
    const authToken = token || this.getTokenFromStorage();

    console.log(
      "🔌 Attempting to connect with token:",
      authToken ? "Present" : "Missing"
    );

    if (!authToken) {
      console.error("❌ No authentication token available");
      return null;
    }

    if (this.socket) {
      this.disconnect();
    }

    // Function to get the socket server URL
    const getSocketUrl = () => {
      // If we're on a phone/different device, use the network IP
      if (window.location.hostname !== 'localhost') {
        return `http://${window.location.hostname}:8800`;
      }
      // Fallback to localhost
      return "http://localhost:8800";
    };

    this.socket = io(getSocketUrl(), {
      auth: {
        token: authToken,
      },
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
    });

    this.socket.on("connect", () => {
      console.log("🔌 Connected to server with ID:", this.socket.id);
      this.connected = true;

      // Request current online users
      this.socket.emit("get_online_users");
    });

    this.socket.on("disconnect", (reason) => {
      console.log("🔌 Disconnected from server. Reason:", reason);
      this.connected = false;
      this.onlineUsers.clear();
    });

    this.socket.on("connect_error", (error) => {
      console.error("🔌 Connection error:", error.message);
      this.connected = false;
    });

    this.socket.on("error", (error) => {
      console.error("🔌 Socket error:", error);
    });

    this.socket.on("reconnect", (attemptNumber) => {
      console.log("🔌 Reconnected after", attemptNumber, "attempts");
    });

    this.socket.on("reconnect_error", (error) => {
      console.error("🔌 Reconnection error:", error);
    });

    // Handle online status events
    this.socket.on("user_online", (data) => {
      this.onlineUsers.add(data.userId);
      console.log(`👤 User ${data.userId} is now online`);
    });

    this.socket.on("user_offline", (data) => {
      this.onlineUsers.delete(data.userId);
      console.log(`👤 User ${data.userId} is now offline`);
    });

    this.socket.on("online_users", (userIds) => {
      this.onlineUsers = new Set(userIds);
      console.log(`👥 ${userIds.length} users online`);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.onlineUsers.clear();
    }
  }

  isUserOnline(userId) {
    return this.onlineUsers.has(userId);
  }

  getOnlineUsers() {
    return Array.from(this.onlineUsers);
  }

  sendMessage(receiverId, content) {
    console.log("📤 SocketService.sendMessage called:", {
      receiverId,
      content
    });
    console.log("📡 Socket status:", {
      hasSocket: !!this.socket,
      connected: this.connected,
      socketConnected: this.socket?.connected,
      socketId: this.socket?.id,
    });

    if (!this.socket) {
      console.error("❌ No socket instance");
      return false;
    }

    if (!this.socket.connected) {
      console.error("❌ Socket not connected, attempting to reconnect...");
      // Try to reconnect
      const token = this.getTokenFromStorage();
      if (token) {
        this.connect(token);
      }
      return false;
    }

    console.log("✅ Emitting send_message event");
    this.socket.emit("send_message", {
      receiverId,
      content
    });
    return true;
  }

  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on("new_message", callback);
    }
  }

  onMessageSent(callback) {
    if (this.socket) {
      this.socket.on("message_sent", callback);
    }
  }

  onMessageError(callback) {
    if (this.socket) {
      this.socket.on("message_error", callback);
    }
  }

  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on("user_typing", callback);
    }
  }

  onUserStopTyping(callback) {
    if (this.socket) {
      this.socket.on("user_stop_typing", callback);
    }
  }

  onUserOnline(callback) {
    if (this.socket) {
      this.socket.on("user_online", callback);
    }
  }

  onUserOffline(callback) {
    if (this.socket) {
      this.socket.on("user_offline", callback);
    }
  }

  onOnlineUsersUpdate(callback) {
    if (this.socket) {
      this.socket.on("online_users", callback);
    }
  }

  sendTyping(receiverId) {
    if (this.socket && this.connected) {
      this.socket.emit("typing", { receiverId });
    }
  }

  sendStopTyping(receiverId) {
    if (this.socket && this.connected) {
      this.socket.emit("stop_typing", { receiverId });
    }
  }

  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  isConnected() {
    return this.connected;
  }
}

export default new SocketService();
