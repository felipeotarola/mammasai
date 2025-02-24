import { experimental_generateImage as generateImage } from "ai"
import { openai } from "@ai-sdk/openai"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

    const { image } = await generateImage({
      model: openai.image("dall-e-3"),
      prompt,
      size: "1024x1024",
    })

    // Convert the image to a base64 URL
    const imageUrl = `data:image/png;base64,${image.base64}`

    // Save to database
    const savedImage = await prisma.image.create({
      data: {
        prompt,
        imageUrl,
      },
    })

    return Response.json({ imageUrl: savedImage.imageUrl })
  } catch (error) {
    console.error("Error generating image:", error)
    return Response.json({ error: "Failed to generate image" }, { status: 500 })
  }
}

// Add a GET endpoint to fetch all images
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

