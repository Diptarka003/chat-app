import { client } from "../config/db.js";

// ✅ Access or create a chat between two users
export const accessChat = async (req, res) => {
  try {
    const myId = req.user.id;   // current logged-in user
    const { userId } = req.body; // the other person you want to chat with

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // 🔍 Check if chat already exists between both users
    const existingChat = await client.query(
      "SELECT * FROM conversations WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)",
      [myId, userId]
    );

    if (existingChat.rows.length > 0) {
      // If chat exists, send it back
      return res.json(existingChat.rows[0]);
    }

    // 🆕 Otherwise, create a new conversation
    const newChat = await client.query(
      "INSERT INTO conversations (user1_id, user2_id) VALUES ($1, $2) RETURNING *",
      [myId, userId]
    );

    res.status(201).json(newChat.rows[0]);
  } catch (error) {
    console.error("Error in accessChat:", error);
    res.status(500).json({ message: "Something went wrong while accessing chat" });
  }
};

// ✅ Get all chats for the current user
export const fetchChats = async (req, res) => {
  try {
    const myId = req.user.id;

    const query = `
      SELECT 
        c.id AS conversation_id,
        CASE 
          WHEN c.user1_id = $1 THEN u2.username 
          ELSE u1.username 
        END AS chat_with,
        u1.id AS user1_id,
        u2.id AS user2_id
      FROM conversations c
      JOIN users u1 ON c.user1_id = u1.id
      JOIN users u2 ON c.user2_id = u2.id
      WHERE c.user1_id = $1 OR c.user2_id = $1
      ORDER BY c.created_at DESC;
    `;

    const result = await client.query(query, [myId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ message: "Failed to fetch chats" });
  }
};
