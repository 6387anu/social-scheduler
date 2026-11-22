import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware.js";
import { GoogleGenAI } from "@google/genai";
import { InferenceClient } from "@huggingface/inference";
import { Generation } from "../models/Generation.js";
import { Post } from "../models/Post.js";
import { cloudinary } from "../config/cloudinary.js";

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
        
// Generate Text with automatic retry for temporary Gemini errors

        const geminiPrompt = `Generate a social media post based on this prompt: "${prompt}".
        Tone: ${tone}.
        Include relevant hashtags.

        Return ONLY valid JSON:
        {
            "content": "The social media post",
            "imagePrompt": "A detailed image generation prompt"
        }

        Do not include Markdown code fences.
        Do not include any explanation outside the JSON.`;

        let textResponse: any;

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                console.log(`Gemini API attempt: ${attempt}`);

                textResponse = await ai.models.generateContent({
                    model: "gemini-3.8-flash",
                    contents: geminiPrompt,
                });

                break;

            } catch (error: any) {
                const status = Number(
                    error?.status ??
                    error?.code ??
                    error?.response?.status
                );

                const message = error?.message || "";

                const isTemporaryError =
                    status === 503 ||
                    /UNAVAILABLE|high demand|overloaded/i.test(message);

                if (!isTemporaryError || attempt === 3) {
                    throw error;
                }

                const delay = attempt * 3000;

                console.log(
                    `Gemini temporarily unavailable. Retrying in ${delay / 1000} seconds...`
                );

                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        if (!textResponse) {
            throw new Error("Gemini failed to generate content.");
        }


        // improved code for generations
        let content = "";
        let imagePrompt = prompt;

        const rawText = (textResponse.text || "").trim();

        try {
            // Remove Markdown code fences if Gemini returns them
            const cleanedText = rawText
                .replace(/^```json\s*/i, "")
                .replace(/^```\s*/i, "")
                .replace(/\s*```$/, "")
                .trim();

            // Extract JSON object
            const startIndex = cleanedText.indexOf("{");
            const endIndex = cleanedText.lastIndexOf("}");

            if (startIndex === -1 || endIndex === -1) {
                throw new Error("Gemini did not return valid JSON");
            }

            const jsonText = cleanedText.substring(
                startIndex,
                endIndex + 1
            );

            const data = JSON.parse(jsonText);

            content = data.content;
            imagePrompt = data.imagePrompt || prompt;

            console.log("Generated content:", content);
            console.log("Generated image prompt:", imagePrompt);

            if (!content) {
                throw new Error("Generated content is missing");
            }

        } catch (error) {
            console.error("Gemini response parsing error:", error);
            console.error("Gemini raw response:", rawText);

            res.status(500).json({
                message: "Failed to parse AI-generated content"
            });

            return;
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

    }catch (error: any) {
        console.error("Generate post error:", error);

        const status = Number(
            error?.status ??
            error?.code ??
            error?.response?.status
        );

        if (status === 503 || /UNAVAILABLE|high demand/i.test(error?.message || "")) {
            res.status(503).json({
                message: "Gemini is temporarily unavailable. Please try again in a few moments.",
                code: 503
            });
            return;
        }

        res.status(500).json({
            message: error?.message || "Server error"
        });
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
        console.log("Request URL:", req.originalUrl);
        console.log("Content-Type:", req.headers["content-type"]);
        console.log("Request body:", req.body);
        console.log("Uploaded file:", req.file);

        if (!req.body) {
            res.status(400).json({ message: "Request body is missing" });
            return;
        }

        const { content, platforms, scheduledFor, status } = req.body;

        let parsedPlatforms = platforms;

        if (typeof platforms === "string") {
            try {
                parsedPlatforms = JSON.parse(platforms);
            } catch (e) {
                parsedPlatforms = platforms.split(",");
            }
        }

        let mediaUrl: string | undefined = req.body.mediaUrl;
        let mediaType: "image" | "video" | undefined = req.body.mediaType;

        // Upload image/video to Cloudinary
        if (req.file) {
            const uploadResult = await new Promise<any>((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: "scheduled-posts",
                        resource_type: "auto",
                    },
                    (error, result) => {
                        if (error) {
                            console.error("Cloudinary upload error:", error);
                            reject(error);
                        } else if (!result) {
                            reject(new Error("Cloudinary returned no upload result"));
                        } else {
                            resolve(result);
                        }
                    }
                );

                stream.end(req.file!.buffer);
            });

            mediaUrl = uploadResult.secure_url;

            mediaType = req.file.mimetype.startsWith("video/")
                ? "video"
                : "image";

            console.log("Cloudinary URL:", mediaUrl);
        }


        const post = await Post.create({
            user: req.user._id,
            content,
            platforms: parsedPlatforms,
            mediaUrl,
            mediaType,
            scheduledFor,
            status,
        });

        res.status(201).json(post);

    } catch (error: any) {
        console.error("Schedule Post Error:", {
            message: error.message,
            http_code: error.http_code,
            name: error.name,
            details: error.error
        });

        res.status(500).json({
            message: error?.message || "Server error"
        });
    }
};
