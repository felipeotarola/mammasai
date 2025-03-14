import { PrismaClient } from "@prisma/client"
import { NextRequest } from "next/server";

const prisma = new PrismaClient()

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) {
    const id = (await params).id;  try {
    await prisma.styleTemplate.delete({
      where: { id},
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error("Error deleting template:", error)
    return Response.json({ error: "Failed to delete template" }, { status: 500 })
  }
}

