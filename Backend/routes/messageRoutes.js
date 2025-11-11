import express from "express";
import {auth} from "../middlewares/auth.js";
import { fetchMessages, sendMessage } from "../controllers/messageControllers.js";

const messageRouter = express.Router();

messageRouter.get("/:conversationId", auth, fetchMessages);
messageRouter.post("/", auth, sendMessage);

export default messageRouter;
