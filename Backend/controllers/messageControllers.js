import { client } from "../config/db.js";

// ✅ Get all messages for a conversation
export const fetchMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    // 📨 Get all messages in that chat
    const messages = await client.query(
      "SELECT * FROM messages WHERE conversation_id = $1 ORDER BY sent_at ASC",
      [conversationId]
    );

    res.json(messages.rows);
  } catch (error) {
    console.error("Error in fetchMessages:", error);
    res.status(500).json({ message: "Could not fetch messages" });
  }
};

// ✅ Send a new message
export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { conversationId, content } = req.body;

    if (!conversationId || !content) {
      return res.status(400).json({ message: "Conversation ID and content are required" });
    }

    // 💬 Insert the new message
    const result = await client.query(
      "INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3) RETURNING *",
      [conversationId, senderId, content]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error in sendMessage:", error);
    res.status(500).json({ message: "Could not send message" });
  }
};
