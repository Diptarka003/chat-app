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

export const login=async(req,res)=>{
    const {email,password}=req.body
    if(!email|| !password)
    {
         res.status(400).json({"message":"Enter email and password"})
    }
    const user= await getUser(email)
    const isMatch= bcrypt.compare(password,user.password)
    if(!isMatch)
    {
        res.statsu(400).json({"message":"Invalid credentials"})
    }
    const token= jwt.sign({
        id: user.id,
        username:user.username,
        email:user.email
    },process.env.JWT_SECRET,{expiresIn:"7d"})
    return res.status(200).json({
      message: "Login successful",
      id: user.id,
      username: user.username,
      email: user.email,
      token,
    });
}

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

export const searchUsers = async (req, res) => {
  const { query } = req.query;
  try {
    const result = await client.query(
      `SELECT id, username, email FROM users WHERE username ILIKE $1 LIMIT 10`,
      [`%${query}%`]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while searching users" });
  }
};