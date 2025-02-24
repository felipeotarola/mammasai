import { experimental_generateImage as generateImage } from "ai"
import { openai } from "@ai-sdk/openai"
import { PrismaClient } from "@prisma/client"
import { put } from "@vercel/blob"

const prisma = new PrismaClient()
function sanitizeFilename(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
  }
export async function POST(req: Request) {
  try {
    const { prompt, systemPrompt } = await req.json()

    // Combine the system prompt and user prompt
    const combinedPrompt = systemPrompt ? `${systemPrompt} Create this: ${prompt}` : prompt

    const { image } = await generateImage({
      model: openai.image("dall-e-3"),
      prompt: combinedPrompt,
      size: "1024x1024",
    })

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(image.base64, "base64")

    // Generate a filename based on timestamp and random string
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

    return Response.json({
      imageUrl: savedImage.imageUrl,
      id: savedImage.id,
    })
  } catch (error) {
    console.error("Error generating image:", error)
    return Response.json({ error: "Failed to generate image" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const images = await prisma.image.findMany({
      orderBy: {
        createdAt: "desc",
      },
    })

    return Response.json({ images })
  } catch (error) {
    console.error("Error fetching images:", error)
    return Response.json({ error: "Failed to fetch images" }, { status: 500 })
  }
}

