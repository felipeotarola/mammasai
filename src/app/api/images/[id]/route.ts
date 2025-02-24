import { PrismaClient } from "@prisma/client"
import { del } from "@vercel/blob"
import { NextRequest } from "next/server";

const prisma = new PrismaClient()

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) {
    const id = (await params).id;


  try {

    const image = await prisma.image.findUnique({
      where: { id },
    })

    if (!image) {
      return Response.json({ error: "Image not found" }, { status: 404 })
    }

    // Radera från Vercel Blob med hjälp av blobId
    await del(image.blobId)

    // Radera från databasen
    await prisma.image.delete({
      where: { id },
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error("Error deleting template:", error)
    return Response.json({ error: "Failed to delete template" }, { status: 500 })
  }
}
