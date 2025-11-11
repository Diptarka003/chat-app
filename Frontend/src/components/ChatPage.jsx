import React, { useEffect, useState, useRef } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import socket from "../socket";

const ChatPage = () => {
  const { conversationId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [receiverId, setReceiverId] = useState(null);
  const messagesEndRef = useRef(null);
  const hasJoinedRef = useRef(false); // Prevent duplicate joins
  const chatWith = location.state?.chatWith || "User";

  // Extract user ID from localStorage
  const adminData = JSON.parse(localStorage.getItem("admin"));
  const userId = adminData?.id;

  // Scroll to bottom automatically
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch existing messages for this conversation
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/api/messages/${conversationId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await res.json();
        if (res.ok) {
          setMessages(data);
          console.log("🔍 DEBUG - First message:", data[0]);
console.log("🔍 DEBUG - userId from localStorage:", userId);
console.log("🔍 DEBUG - Comparison:", 
  `sender_id: ${data[0]?.sender_id} (${typeof data[0]?.sender_id})`, 
  `userId: ${userId} (${typeof userId})`
);
          if (data.length > 0) {
            const first = data[0];
            setReceiverId(
              first.sender_id === parseInt(userId)
                ? first.receiver_id
                : first.sender_id
            );
          }
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [conversationId, navigate, userId]);

  // Socket setup: connect ONCE + join room + listen for messages
  useEffect(() => {
    if (!conversationId || hasJoinedRef.current) return;

    console.log("🔌 Connecting socket...");

    // Connect the socket if not already connected
    if (!socket.connected) {
      socket.connect();
    }

    // Wait for connection before joining
    const handleConnect = () => {
      console.log("✅ Socket connected:", socket.id);
      
      // Join the conversation room ONCE
      if (!hasJoinedRef.current) {
        socket.emit("join_conversation", conversationId);
        hasJoinedRef.current = true;
        console.log("✅ Joined conversation room:", conversationId);
      }
    };

    // Handle received messages from OTHER users
    const handleReceiveMessage = (data) => {
      console.log("📩 Message received from socket:", data);
      
      // Only add message if it's for this conversation
      if (data.conversationId === parseInt(conversationId)) {
        setMessages((prev) => {
          // Prevent duplicates by checking message ID
          const messageExists = prev.some(msg => msg.id === data.message.id);
          if (messageExists) {
            console.log("⚠️ Duplicate message prevented");
            return prev;
          }
          console.log("✅ Adding new message to state");
          return [...prev, data.message];
        });
      }
    };

    // If already connected, join immediately
    if (socket.connected) {
      handleConnect();
    } else {
      socket.on("connect", handleConnect);
    }

    // Listen for messages
    socket.on("receive_message", handleReceiveMessage);

    // Cleanup on unmount
    return () => {
      console.log("🧹 Cleaning up socket listeners");
      socket.off("connect", handleConnect);
      socket.off("receive_message", handleReceiveMessage);
      
      // Leave the room
      if (hasJoinedRef.current) {
        socket.emit("leave_conversation", conversationId);
        hasJoinedRef.current = false;
      }
      
      // DON'T disconnect - keep connection alive for navigation
      // socket.disconnect();
    };
  }, [conversationId]);

  // Send a new message
  const sendMessage = async () => {
    const token = localStorage.getItem("token");
    if (!input.trim()) return;

    const messageData = {
      conversationId,
      content: input,
    };

    try {
      console.log("📤 Sending message...");
      
      // 1. Send message to backend (save in DB)
      const res = await fetch("http://localhost:8000/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(messageData),
      });

      const data = await res.json();

      if (res.ok) {
        console.log("✅ Message saved to DB:", data);
        
        // 2. Add message to local state immediately
        setMessages((prev) => [...prev, data]);
        setInput("");

        // 3. Broadcast to OTHER users in the room via socket
        console.log("📡 Broadcasting message via socket");
        socket.emit("send_message", {
          conversationId: parseInt(conversationId),
          message: data,
        });
      }
    } catch (err) {
      console.error("❌ Error sending message:", err);
    }
  };

  if (loading)
    return (
      <div className="text-center mt-20 text-gray-600">
        Loading messages...
      </div>
    );

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="p-4 bg-blue-600 text-white font-bold text-lg flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="text-white bg-blue-500 px-2 py-1 rounded-md hover:bg-blue-700"
        >
          ← Back
        </button>
        <span>Chat with {chatWith}</span>
      </div>

      {/* Messages */}
{/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => {
          // Make sure both sides are numbers
          const isMine = Number(msg.sender_id) === Number(userId);

          return (
            <div
              key={i}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm wrap-break-word shadow-sm ${
                  isMine
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-200 text-gray-900 rounded-bl-none"
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>


      {/* Input */}
      <div className="p-4 flex items-center bg-white border-t">
        <input
          type="text"
          className="flex-1 border border-gray-300 rounded-md p-2 mr-2"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatPage;