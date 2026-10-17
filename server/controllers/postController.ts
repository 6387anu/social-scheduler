import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware.js";
import { GoogleGenAI } from "@google/genai";
import { InferenceClient } from "@huggingface/inference";
import { Generation } from "../models/Generation.js";
import { Post } from "../models/Post.js";

// Generate post
// POST /api/posts/generate

export const generatePost = async (req: AuthRequest, res: Response): Promise<void> =>{
    try {
        const { prompt, tone, generateImage} = req.body;

        const apiKey = process.env.GEMINI_API_KEY;
        if(!apiKey){
            res.status(400).json({message: "Gemini API Key is missing. Please add it to your server/.env file"});
            return;
        }

        const ai = new GoogleGenAI({apiKey});

        //Generate Text
        const textResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate a social media post based on this prompt: "${prompt}". 
            Tone: ${tone}. 
            Include relevent hashtags.
            Format the response as JSON with "content" and "imagePrompt" field.
            The "imagePrompt" should be a highly descriptive prompt for an image generator that complement the post.`,
        });

        let content = "";
        let imagePrompt = prompt;

        try {
            const rawText = textResponse.text || "";
            const jsonMatch = rawText.match(/\{[\s\s]*\}/);
            const data = jsonMatch ? JSON.parse(jsonMatch[0]) : {content: rawText, imagePrompt: prompt};
            content = data.content;
            imagePrompt = data.imagePrompt;
        } catch (e) {
            content = textResponse.text || ""
        }

        // Hugging face image generation
        let mediaUrl = "";
        if(generateImage){
            try {
                const hfToken = process.env.HF_TOKEN;
                if(!hfToken){
                    throw new Error(
                        "Hugging Face API token is missing. Please add HF_TOKEN to server/.env"
                    );
                }

                const hf = new InferenceClient(hfToken);

                console.log("Generating image with Hugging Face...");
                console.log("Image prompt:", imagePrompt);

                const imageUrl = await hf.textToImage(
                    {
                        model: "black-forest-labs/FLUX.1-schnell",
                        inputs: imagePrompt,
                        parameters: {
                            width: 1024,
                            height: 1024,
                            num_inference_steps: 4
                        }
                    },
                    {
                        outputType: "url"
                    }
                );

                mediaUrl = imageUrl;

                console.log("Image generated successfully!");
                console.log("Image URL:", mediaUrl);

            } catch (err: any) {
                console.log("Hugging Face image generation failed:", err?.message || err);
            }
        }

        //SAVE TO DATABASE
        const generation = await Generation.create({
            user: req.user._id,
            prompt,
            content,
            mediaUrl,
            mediaType: mediaUrl? "image": undefined,
            tone
        });

        res.json(generation);

    } catch (error: any) {
        console.error("Generate post error:",
            error);
        res.status(500).json({message: error?.message || "Server error"});
    }
}

// Get generations
// GET /api/posts/generations

export const getGenerations = async (req: AuthRequest, res: Response): Promise<void>=>{
    try {
        const generations = await Generation.find({user: req.user._id}).sort({createdAt: -1})
        res.json(generations);
    } catch (error: any) {
        res.status(500).json({message: error?.message || "Server error"});
    }
}

// Get posts
// GET /api/posts

export const getPosts = async(req: AuthRequest, res: Response): Promise<void> =>{
     try {
        const posts = await Post.find({user: req.user._id})
        res.json(posts)
     } catch (error: any) {
        res.status(500).json({message: error?.message || "Server error"});
     }
}

// Schedule post
// POST /api/posts

export const schedulePost = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const {content, platforms, scheduledFor, status} = req.body;

        // Parse platform if it comes as a stringyfied array from FormData
        let parsedPlatforms = platforms;
        if(typeof platforms === "string"){
            try {
                parsedPlatforms = JSON.parse(platforms)
            } catch (e) {
                parsedPlatforms = platforms.split(",");
            }
        }
        let mediaUrl: string | undefined = req.body.mediaUrl;
        let mediaType: "image" | "video" | undefined = req.body.mediaType;

        const post = await Post.create({
            user: req.user._id,
            content,
            platforms: parsedPlatforms,
            mediaUrl,
            mediaType,
            scheduledFor,
            status,
        })
        res.status(201).json(post)


    } catch (error: any) {
        res.status(500).json({message: error?.message || "Server error"});
    }
}