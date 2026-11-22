
import "dotenv/config";

const test = async () => {
    try {
        console.log("Testing Fal AI image generation...");

        const response = await fetch(
            "https://router.huggingface.co/fal-ai/fal-ai/flux/schnell",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.HF_TOKEN}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    prompt: "A futuristic AI classroom with computers, realistic photography",
                    image_size: "square",
                    num_inference_steps: 4
                })
            }
        );

        console.log("HTTP Status:", response.status);
        console.log("Content Type:", response.headers.get("content-type"));

        if (!response.ok) {
            console.log("Error:", await response.text());
            return;
        }

        const imageBuffer = Buffer.from(
            await response.arrayBuffer()
        );

        const fs = await import("fs");

        fs.writeFileSync("huggingface-test.png", imageBuffer);

        console.log("SUCCESS! Image saved as huggingface-test.png");
        console.log("Image size:", imageBuffer.length, "bytes");

    } catch (error) {
        console.error("Image generation failed:", error);
        console.error("Cause:", error.cause);
    }
};

test();
