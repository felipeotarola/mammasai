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

    const video = await prisma.video.findUnique({
      where: { id },
    })

    if (!video) {
      return Response.json({ error: "video not found" }, { status: 404 })
    }

    // Radera från Vercel Blob med hjälp av blobId
    await del(video.blobId)

    // Radera från databasen
    await prisma.video.delete({
      where: { id },
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error("Error deleting template:", error)
    return Response.json({ error: "Failed to delete template" }, { status: 500 })
  }
}
