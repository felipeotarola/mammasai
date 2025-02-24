import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const templates = await prisma.styleTemplate.findMany({
      orderBy: {
        createdAt: "desc",
      },
    })

    return Response.json({ templates })
  } catch (error) {
    console.error("Error fetching templates:", error)
    return Response.json({ error: "Failed to fetch templates" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const template = await prisma.styleTemplate.create({
      data: {
        name: body.name,
        description: body.description,
        prompt: body.prompt,
      },
    })

    return Response.json(template)
  } catch (error) {
    console.error("Error creating template:", error)
    return Response.json({ error: "Failed to create template" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const template = await prisma.styleTemplate.update({
      where: { id: body.id },
      data: {
        name: body.name,
        description: body.description,
        prompt: body.prompt,
      },
    })

    return Response.json(template)
  } catch (error) {
    console.error("Error updating template:", error)
    return Response.json({ error: "Failed to update template" }, { status: 500 })
  }
}

