import express from "express"
import { signup, login, getCurrentUser } from "../controllers/userControllers.js"
import { auth } from "../middlewares/auth.js"
const userRouter = express.Router()

userRouter.post("/signup",signup)
userRouter.post("/login",login)
userRouter.get("/me",auth,getCurrentUser)
export default userRouter