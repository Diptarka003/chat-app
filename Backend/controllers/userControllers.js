import { createUser, getUser } from "../models/userModels.js"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
export const signup=async(req,res)=>{
    const {username,email,password}=req.body
    if(!username|| !email|| !password)
    {
        res.status(400).json({"message":"Enter all fields"})
    }
    if(await getUser(email))
    {
        res.status(400).json({"message":"User already exists"})
    }
    const hashedpassword=await bcrypt.hash(password,10)
    const newUser= createUser(username,email,hashedpassword)
    res.status(201).json(newUser)
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Enter email and password" });
    }

    const user = await getUser(email);

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // ✅ Properly sign JWT with user ID and username
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      token,
    });
  } catch (err) {
    console.error("❌ Error in login:", err);
    res.status(500).json({ message: "Login failed" });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const { email } = req.user.email; 
    const result = await getUser(email)
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching current user:", error);
    res.status(500).json({ message: "Failed to fetch user info" });
  }
};

