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
  const messagesEndRef = useRef(null);
  const chatWith = location.state?.chatWith || "User";

  // Extract user ID from localStorage
  // Get userId from localStorage - check both possible field names
  const adminData = JSON.parse(localStorage.getItem("admin"));
  const userId = adminData?.id || adminData?.userId;
  
  // Debug: Log userId on mount
  useEffect(() => {
    console.log("🔍 Current userId from localStorage:", userId, typeof userId);
  }, [userId]);

  // Scroll to bottom automatically
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch existing messages
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
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [conversationId, navigate]);

  // Socket connection and room management
  useEffect(() => {
    if (!conversationId) return;

    // Connect socket immediately
    if (!socket.connected) {
      socket.connect();
    }

    const joinRoom = () => {
      socket.emit("join_conversation", conversationId);
    };

    const handleReceiveMessage = (data) => {
      if (data.conversationId === parseInt(conversationId)) {
        setMessages((prev) => {
          const exists = prev.some(m => m.id === data.message.id);
          if (exists) return prev;
          return [...prev, data.message];
        });
      }
    };

    const handleConnect = () => {
      setTimeout(() => {
        joinRoom();
      }, 100);
    };

    // Check current connection state
    if (socket.connected) {
      joinRoom();
    } else {
      socket.on("connect", handleConnect);
    }

    // Listen for incoming messages
    socket.on("receive_message", handleReceiveMessage);

    // Cleanup
    return () => {
      socket.off("connect", handleConnect);
      socket.off("receive_message", handleReceiveMessage);
      socket.emit("leave_conversation", conversationId);
    };
  }, [conversationId]);

  // Send message
  const sendMessage = async () => {
    const token = localStorage.getItem("token");
    if (!input.trim()) return;

    const trimmedInput = input.trim();
    setInput(""); // Clear input immediately for better UX

    try {
      console.log("📤 Sending message:", trimmedInput);
      
      const res = await fetch("http://localhost:8000/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId,
          content: trimmedInput,
        }),
      });

      const savedMessage = await res.json();

      if (res.ok) {
        console.log("✅ Message saved:", savedMessage);
        
        // Add to local UI immediately
        setMessages((prev) => [...prev, savedMessage]);

        // Emit to socket for others
        console.log("📡 Emitting to socket, room:", conversationId);
        socket.emit("send_message", {
          conversationId: parseInt(conversationId),
          message: savedMessage,
        });
      } else {
        console.error("❌ Failed to save message:", savedMessage);
        setInput(trimmedInput); // Restore input on failure
      }
    } catch (err) {
      console.error("❌ Error sending message:", err);
      setInput(trimmedInput); // Restore input on error
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-20 text-gray-600">
        Loading messages...
      </div>
    );
  }

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
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            // Convert both to numbers for comparison
            const isMine = Number(msg.sender_id) === Number(userId);
            
            return (
              <div
                key={msg.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm shadow-sm ${
                    isMine
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-gray-200 text-gray-900 rounded-bl-none"
                  }`}
                  style={{ wordBreak: "break-word" }}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
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
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
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