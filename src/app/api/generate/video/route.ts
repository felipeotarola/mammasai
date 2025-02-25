import { PrismaClient } from "@prisma/client"
import { put } from "@vercel/blob"
import Replicate from "replicate"

const prisma = new PrismaClient()

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

const TIMEOUT_MILLIS = 300 * 1000

/**
 * Wraps a promise so that it rejects if it doesn’t settle within `timeoutMillis`
 */
function withTimeout<T>(promise: Promise<T>, timeoutMillis: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_resolve, reject) =>
      setTimeout(() => reject(new Error("Video generation timed out")), timeoutMillis)
    ),
  ])
}

export const maxDuration = 300; // 5 minutes

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

export async function POST(req: Request) {
  try {
    // Expecting prompt, systemPrompt, and firstFrameImage (URL) in the request body.
    const { prompt, systemPrompt, firstFrameImage } = await req.json()

    // Combine the system prompt and user prompt.
    const combinedPrompt = systemPrompt ? `${systemPrompt} Create this: ${prompt}` : prompt

    console.log("Generating video with prompt:", combinedPrompt)

    // Setup input for the replicate model.
    const input = {
      prompt: combinedPrompt,
      prompt_optimizer: true,
      first_frame_image: firstFrameImage, // URL string for the first frame image.
    }

    // Run the video-generation model on Replicate with a timeout.
    const generatePromise = replicate.run("minimax/video-01-live", { input })
    console.log("Running Replicate model..." + generatePromise)
    const videoOutputStream = await withTimeout(generatePromise, TIMEOUT_MILLIS)

    // Convert the ReadableStream output into text.
    const streamResponse = new Response(videoOutputStream as ReadableStream)
    const textOutput = await streamResponse.text()

    // Parse the output (expecting JSON with an "output" property)
    let parsedOutput: any
    try {
      parsedOutput = JSON.parse(textOutput)
    } catch (parseError) {
      throw new Error("Failed to parse output from Replicate")
    }

    // Extract the video URL from the "output" property.
    const videoUrl = parsedOutput?.output
    if (typeof videoUrl !== "string") {
      throw new Error("Video generation output is not a valid URL string.")
    }

    // Fetch the video and convert it to a buffer for uploading to Vercel Blob.
    const response = await fetch(videoUrl)
    const videoBuffer = Buffer.from(await response.arrayBuffer())

    // Create a sanitized filename based on the prompt.
    const sanitizedPrompt = sanitizeFilename(prompt.slice(0, 50))
    const filename = `mammasai/${Date.now()}-${sanitizedPrompt}.mp4`

    // Upload the video to Vercel Blob.
    const { url, pathname } = await put(filename, videoBuffer, {
      access: "public",
      contentType: "video/mp4",
    })

    // Save the generated video record to the database using the Video model.
    const savedVideo = await prisma.video.create({
      data: {
        prompt: combinedPrompt,
        videoUrl: url,
        blobId: pathname,
      },
    })

    return new Response(
      JSON.stringify({
        videoUrl: savedVideo.videoUrl,
        id: savedVideo.id,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )
  } catch (error) {
    console.error("Error generating video:", error)
    return new Response(
      JSON.stringify({ error: "Failed to generate video" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
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
