// Backend/config/db.js
import { Client } from "pg";
import dotenv from "dotenv";
dotenv.config();

const client = new Client({
  connectionString: process.env.POSTGRES_URL,
});

// named export for client and connectDB
const connectDB = async () => {
  try {
    await client.connect();
    console.log("✅ Connected to PostgreSQL database");
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1);
  }
};

export { client, connectDB };
