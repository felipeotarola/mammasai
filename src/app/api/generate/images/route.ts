import { experimental_generateImage as generateImage } from "ai"
import { openai } from "@ai-sdk/openai"
import { PrismaClient } from "@prisma/client"
import { put } from "@vercel/blob"
import { replicate } from "@ai-sdk/replicate";
import { fireworks } from "@ai-sdk/fireworks";

const prisma = new PrismaClient()

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

// Timeout duration in milliseconds (300 seconds in this example)
const TIMEOUT_MILLIS = 300 * 1000

/**
 * Wraps a promise so that it rejects if it doesn’t settle within `timeoutMillis`
 */
function withTimeout<T>(promise: Promise<T>, timeoutMillis: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_resolve, reject) =>
      setTimeout(() => reject(new Error("Image generation timed out")), timeoutMillis)
    ),
  ])
}
export const maxDuration = 300; // 5 minutes


export async function POST(req: Request) {
  try {
    const { prompt, systemPrompt } = await req.json()

    // Combine the system prompt and user prompt
    const combinedPrompt = systemPrompt ? `${systemPrompt} Create this: ${prompt}` : prompt

    console.log("Generating image with prompt:", combinedPrompt)

    // Wrap the image generation with a timeout
    const generatePromise = generateImage({
      // model: fireworks.image('accounts/fireworks/models/flux-1-dev-fp8'),
      model: openai.image('dall-e-3'),
      prompt: combinedPrompt,
      size: "1024x1024",
    }).then(({ image, warnings }) => {
      if (warnings && warnings.length > 0) {
        console.warn("Image generation warnings:", warnings)
      }
      return image
    })

    const imageResult = await withTimeout(generatePromise, TIMEOUT_MILLIS)

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageResult.base64, "base64")

    // Create a sanitized version of the prompt for the filename (first 50 chars)
    const sanitizedPrompt = sanitizeFilename(prompt.slice(0, 50))

    // Generate a filename with timestamp and sanitized prompt
    const filename = `mammasai/${Date.now()}-${sanitizedPrompt}.png`

    // Upload to Vercel Blob
    const { url, pathname } = await put(filename, imageBuffer, {
      access: "public",
      contentType: "image/png",
    })

    // Save to database with the Vercel Blob URL
    const savedImage = await prisma.image.create({
      data: {
        prompt: combinedPrompt,
        imageUrl: url,
        blobId: pathname, // Store the pathname for deletion
      },
    })

    return new Response(JSON.stringify({
      imageUrl: savedImage.imageUrl,
      id: savedImage.id,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error generating image:", error)
    return new Response(JSON.stringify({ error: "Failed to generate image" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

export async function GET() {
  try {
    const images = await prisma.image.findMany({
      orderBy: {
        createdAt: "desc",
      },
    })

    return new Response(JSON.stringify({ images }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error fetching images:", error)
    return new Response(JSON.stringify({ error: "Failed to fetch images" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
