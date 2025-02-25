import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";
import Replicate from "replicate";

const prisma = new PrismaClient();

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const TIMEOUT_MILLIS = 300 * 1000;

/**
 * Wraps a promise so that it rejects if it doesn’t settle within `timeoutMillis`
 */
function withTimeout<T>(promise: Promise<T>, timeoutMillis: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_resolve, reject) =>
      setTimeout(() => reject(new Error("Video generation timed out")), timeoutMillis)
    ),
  ]);
}

export const maxDuration = 300; // 5 minutes

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Helper function to log messages with a maximum of 100 characters.
function logShort(label: string, message: string) {
  const output = message.length > 100 ? message.substring(0, 100) + "..." : message;
  console.log(label, output);
}

export async function POST(req: Request) {
  try {
    // Expecting prompt, systemPrompt, and firstFrameImage (URL) in the request body.
    const { prompt, systemPrompt, firstFrameImage } = await req.json();
    const combinedPrompt = systemPrompt ? `${systemPrompt} Create this: ${prompt}` : prompt;

    console.log("Generating video with prompt:", combinedPrompt);

    // Setup input for the Replicate model.
    const input = {
      prompt: combinedPrompt,
      prompt_optimizer: true,
      first_frame_image: firstFrameImage, // URL string for the first frame image.
    };

    logShort("Running Replicate model with input:", JSON.stringify(input));

    // Run the video-generation model on Replicate with a timeout.
    const generatePromise = replicate.run("minimax/video-01-live", { input });
    const replicateOutput = await withTimeout(generatePromise, TIMEOUT_MILLIS);
    logShort("Replicate output:", typeof replicateOutput === "string" ? replicateOutput : "[Object with .url()]");

    // Determine how to extract the video URL.
    let videoUrl: string;
    if (typeof replicateOutput === "object" && replicateOutput !== null && "url" in replicateOutput && typeof replicateOutput.url === "function") {
      videoUrl = replicateOutput.url();
      logShort("Extracted video URL from FileOutput object:", videoUrl);
    } else if (typeof replicateOutput === "string") {
      videoUrl = replicateOutput;
      logShort("Extracted video URL from string output:", videoUrl);
    } else {
      throw new Error("Unexpected output format from Replicate");
    }

    // Fetch the video and convert it to a buffer.
    const fetchResponse = await fetch(videoUrl);
    const arrayBuffer = await fetchResponse.arrayBuffer();
    logShort("Fetched video data (as hex):", Buffer.from(arrayBuffer).toString("hex"));
    const videoBuffer = Buffer.from(arrayBuffer);

    // Create a sanitized filename based on the prompt.
    const sanitizedPrompt = sanitizeFilename(prompt.slice(0, 50));
    const filename = `mammasai/${Date.now()}-${sanitizedPrompt}.mp4`;
    console.log("Uploading video to Vercel Blob as:", filename);

    // Upload the video to Vercel Blob.
    const { url, pathname } = await put(filename, videoBuffer, {
      access: "public",
      contentType: "video/mp4",
    });
    logShort("Uploaded video URL:", url);

    // Save the generated video record to the database.
    const savedVideo = await prisma.video.create({
      data: {
        prompt: combinedPrompt,
        videoUrl: url,
        blobId: pathname,
      },
    });

    return new Response(
      JSON.stringify({
        videoUrl: savedVideo.videoUrl,
        id: savedVideo.id,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating video:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate video" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function GET() {
    try {
      const videos = await prisma.video.findMany({
        orderBy: {
          createdAt: "desc",
        },
      })
  
      return new Response(JSON.stringify({ videos }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    } catch (error) {
      console.error("Error fetching videos:", error)
      return new Response(
        JSON.stringify({ error: "Failed to fetch videos" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      )
    }
  }
  