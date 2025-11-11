import express from "express"
import dotenv from "dotenv"
import {connectDB} from "./config/db.js"
import { createSchema } from "./models/schema.js"
import userRouter from "./routes/userRoutes.js"
import cors from "cors"
dotenv.config()
const app=express()
app.use(
  cors({
    origin: "http://localhost:5173", // <-- match exactly, no trailing slash
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json())
app.use("/api/user",userRouter)
connectDB()
createSchema()


app.listen(process.env.PORT,()=>{console.log(`Server running on PORT ${process.env.PORT}`)})