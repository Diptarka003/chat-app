
import { client } from "../config/db.js"
export const createSchema = async () => {
  try {
    // Create Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create Conversations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        user1_id INT REFERENCES users(id) ON DELETE CASCADE,
        user2_id INT REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE (user1_id, user2_id)
      );
    `);

    // Create Messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        conversation_id INT REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id INT REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        sent_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("✅ All tables created successfully");
  } catch (error) {
    console.error("❌ Error creating tables:", error.message);
  }
};
