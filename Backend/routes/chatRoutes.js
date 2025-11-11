import express from "express";
import {auth} from "../middlewares/auth.js";
import { accessChat, fetchChats } from "../controllers/chatControllers.js";

const chatRouter = express.Router();

chatRouter.post("/access", auth, accessChat);
chatRouter.get("/", auth, fetchChats);

export default chatRouter;
