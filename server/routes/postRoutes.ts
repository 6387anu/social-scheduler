import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { generatePost, getGenerations, getPosts, schedulePost } from "../controllers/postController.js";
import { uploadMedia } from "../middlewares/uploadMedia.js";
import { cloudinary } from "../config/cloudinary.js";



const postRouter = express.Router();

postRouter.get('/', protect, getPosts);
postRouter.get('/generations', protect, getGenerations);
postRouter.post('/', protect, uploadMedia, schedulePost);
postRouter.post('/generate', protect, generatePost);

export default postRouter;