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

  const adminData = JSON.parse(localStorage.getItem("admin"));
  const userId = adminData?.id;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  useEffect(() => {
    if (!conversationId || hasJoinedRef.current) return;

    console.log("🔌 Connecting socket...");

    if (!socket.connected) {
      socket.connect();
    }

    const handleConnect = () => {
      console.log("✅ Socket connected:", socket.id);
      
      if (!hasJoinedRef.current) {
        socket.emit("join_conversation", conversationId);
        hasJoinedRef.current = true;
        console.log("✅ Joined conversation room:", conversationId);
      }
    };

    const handleReceiveMessage = (data) => {
      console.log("📩 Message received from socket:", data);
    
      if (data.conversationId === parseInt(conversationId)) {
        setMessages((prev) => {
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

    if (socket.connected) {
      handleConnect();
    } else {
      socket.on("connect", handleConnect);
    }

    socket.on("receive_message", handleReceiveMessage);

    return () => {
      console.log("🧹 Cleaning up socket listeners");
      socket.off("connect", handleConnect);
      socket.off("receive_message", handleReceiveMessage);
      
      if (hasJoinedRef.current) {
        socket.emit("leave_conversation", conversationId);
        hasJoinedRef.current = false;
      }
      
    };
  }, [conversationId]);

  const sendMessage = async () => {
    const token = localStorage.getItem("token");
    if (!input.trim()) return;

    const messageData = {
      conversationId,
      content: input,
    };

    try {
      console.log("Sending message...");
      
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
        setMessages((prev) => [...prev, data]);
        setInput("");

        console.log("Broadcasting message via socket");
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

      <div className="p-4 bg-blue-600 text-white font-bold text-lg flex items-center justify-between">
        <button
          onClick={() => navigate("/HomePage")}
          className="text-white bg-blue-500 px-2 py-1 rounded-md hover:bg-blue-700"
        >
          ← Back
        </button>
        <span>Chat with {chatWith}</span>
      </div>


      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => {
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