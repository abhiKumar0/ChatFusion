"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = initSocket;
exports.getIO = getIO;
var socket_io_1 = require("socket.io");
var ioInstance = null;
function initSocket(server) {
    if (ioInstance)
        return ioInstance;
    ioInstance = new socket_io_1.Server(server, {
        cors: {
            origin: process.env.NODE_ENV === "production"
                ? [process.env.NEXT_PUBLIC_SOCKET_URL, process.env.APP_URL].filter(Boolean)
                : "http://localhost:3000",
            credentials: true,
        },
        transports: ["websocket", "polling"],
        allowEIO3: true,
    });
    // Make ioInstance globally available
    global.ioInstance = ioInstance;
    ioInstance.on("connection", function (socket) {
        console.log("User connected:", socket.id);
        try {
            var userId = socket.handshake.auth.userId;
            if (userId) {
                // Now socket.user.id will work in your other events
                socket.user = { id: userId };
                console.log("Authenticated user ".concat(userId, " for socket ").concat(socket.id));
            }
            else {
                throw new Error("No userId in handshake auth");
            }
        }
        catch (error) {
            console.error("Socket authentication error:", error === null || error === void 0 ? void 0 : error.message);
            socket.disconnect(true); // Disconnect unauthenticated users
            return;
        }
        // Join per-user rooms for notifications
        socket.on("join", function (userId) {
            if (userId) {
                socket.join(userId);
                console.log("User ".concat(userId, " joined their room"));
            }
            else {
                console.log("No userId provided for join event");
            }
        });
        // Join a conversation room
        socket.on("join_conversation", function (conversationId) {
            var _a;
            if (conversationId) {
                socket.join("convo:".concat(conversationId));
                console.log("Socket ".concat(socket.id, " joined conversation ").concat(conversationId));
                console.log("Room convo:".concat(conversationId, " now has ").concat(((_a = ioInstance === null || ioInstance === void 0 ? void 0 : ioInstance.sockets.adapter.rooms.get("convo:".concat(conversationId))) === null || _a === void 0 ? void 0 : _a.size) || 0, " members"));
            }
            else {
                console.log("No conversationId provided for join_conversation event");
            }
        });
        // Handle typing events
        socket.on("typing", function (_a) {
            var conversationId = _a.conversationId;
            if (conversationId) {
                socket.to("convo:".concat(conversationId)).emit("user_typing");
            }
        });
        socket.on("stop_typing", function (_a) {
            var conversationId = _a.conversationId;
            if (conversationId) {
                socket.to("convo:".concat(conversationId)).emit("user_stop_typing");
            }
        });
        // Relay messages sent by clients (optional; API also emits after DB write)
        socket.on("send_message", function (_a) {
            var conversationId = _a.conversationId, message = _a.message;
            if (!conversationId)
                return;
            ioInstance === null || ioInstance === void 0 ? void 0 : ioInstance.to("convo:".concat(conversationId)).emit("receive_message", message);
        });
        // Handle message updates
        socket.on("message_updated", function (_a) {
            var conversationId = _a.conversationId, message = _a.message;
            if (!conversationId)
                return;
            ioInstance === null || ioInstance === void 0 ? void 0 : ioInstance.to("convo:".concat(conversationId)).emit("message_updated", message);
        });
        // Handle message deletions
        socket.on("message_deleted", function (_a) {
            var conversationId = _a.conversationId, messageId = _a.messageId;
            if (!conversationId)
                return;
            ioInstance === null || ioInstance === void 0 ? void 0 : ioInstance.to("convo:".concat(conversationId)).emit("message_deleted", { messageId: messageId });
        });
        // Handle reaction additions
        socket.on("reaction_added", function (_a) {
            var conversationId = _a.conversationId, reaction = _a.reaction;
            if (!conversationId)
                return;
            ioInstance === null || ioInstance === void 0 ? void 0 : ioInstance.to("convo:".concat(conversationId)).emit("reaction_added", reaction);
        });
        // Handle reaction removals
        socket.on("reaction_removed", function (_a) {
            var conversationId = _a.conversationId, messageId = _a.messageId, emoji = _a.emoji;
            if (!conversationId)
                return;
            ioInstance === null || ioInstance === void 0 ? void 0 : ioInstance.to("convo:".concat(conversationId)).emit("reaction_removed", { messageId: messageId, emoji: emoji });
        });
        socket.on("disconnect", function (reason) {
            console.log("User disconnected:", socket.id, "Reason:", reason);
        });
        //Calls
        socket.on('webrtc-offer', function (_a) {
            var _b;
            var recipientId = _a.recipientId, offer = _a.offer;
            // ✅ This is the new, efficient way
            ioInstance === null || ioInstance === void 0 ? void 0 : ioInstance.to(recipientId).emit('webrtc-offer', {
                senderId: (_b = socket === null || socket === void 0 ? void 0 : socket.user) === null || _b === void 0 ? void 0 : _b.id,
                offer: offer,
            });
        });
        socket.on('webrtc-answer', function (_a) {
            var _b;
            var recipientId = _a.recipientId, answer = _a.answer;
            ioInstance === null || ioInstance === void 0 ? void 0 : ioInstance.to(recipientId).emit('webrtc-answer', {
                senderId: (_b = socket.user) === null || _b === void 0 ? void 0 : _b.id,
                answer: answer,
            });
        });
        // Relays network candidates
        socket.on('webrtc-ice-candidate', function (_a) {
            var _b;
            var recipientId = _a.recipientId, candidate = _a.candidate;
            ioInstance === null || ioInstance === void 0 ? void 0 : ioInstance.to(recipientId).emit('webrtc-ice-candidate', {
                senderId: (_b = socket.user) === null || _b === void 0 ? void 0 : _b.id,
                candidate: candidate,
            });
        });
    });
    return ioInstance;
}
function getIO() {
    // Try to get from global first (for API routes)
    var globalIO = global.ioInstance;
    if (globalIO) {
        return globalIO;
    }
    // Fallback to local instance
    if (!ioInstance) {
        throw new Error("Socket.IO not initialized. Call initSocket(server) first.");
    }
    return ioInstance;
}
