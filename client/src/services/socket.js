import { io } from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect(token) {
    if (this.socket) {
      this.disconnect();
    }

    this.socket = io("http://localhost:8800", {
      auth: {
        token: token,
      },
      autoConnect: true,
    });

    this.socket.on("connect", () => {
      console.log("🔌 Connected to server");
      this.connected = true;
    });

    this.socket.on("disconnect", () => {
      console.log("🔌 Disconnected from server");
      this.connected = false;
    });

    this.socket.on("connect_error", (error) => {
      console.error("🔌 Connection error:", error.message);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  sendMessage(receiverId, content) {
    if (this.socket && this.connected) {
      this.socket.emit("send_message", {
        receiverId,
        content,
      });
    }
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
