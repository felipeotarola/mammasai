import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.styleTemplate.delete({
      where: { id: params.id },
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error("Error deleting template:", error)
    return Response.json({ error: "Failed to delete template" }, { status: 500 })
  }
}

