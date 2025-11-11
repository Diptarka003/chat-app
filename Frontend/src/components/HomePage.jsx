import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchChats = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/chats", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        console.log("Fetched chats:", data);

        if (!res.ok) {
          setError(data.message || "Failed to load chats");
        } else {
          setChats(data);
        }
      } catch (err) {
        console.error("Error fetching chats:", err);
        setError("Something went wrong while fetching chats");
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [navigate]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        Loading chats...
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center h-screen text-red-600">
        <p>{error}</p>
      </div>
    );

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-6">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Your Chats</h2>

        {chats.length === 0 ? (
          <p className="text-center text-gray-600">
            No chats yet. Start one by messaging a user!
          </p>
        ) : (
            <ul className="space-y-3">
              {chats.map((chat) => (
                <li
                  key={chat.conversation_id || chat.id}
                  onClick={() =>
                    navigate(`/ChatPage/${chat.conversation_id || chat.id}`, {
                      state: { chatWith: chat.chat_with },
                    })
                  }
                  className="flex items-center gap-3 p-3 border rounded-md hover:bg-gray-50 cursor-pointer transition"
                >
                  <div className="bg-blue-500 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center">
                    {chat.chat_with?.[0]?.toUpperCase()}
                  </div>
                  <p className="font-semibold text-lg">{chat.chat_with}</p>
                </li>
              ))}
            </ul>
        )}

        <button
          onClick={() => {
            localStorage.removeItem("token");
            navigate("/login");
          }}
          className="mt-6 w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default HomePage;
