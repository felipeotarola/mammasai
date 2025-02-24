import { NextRequest } from 'next/server'
import { del } from '@vercel/blob'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the image from the database
    const image = await prisma.image.findUnique({
      where: { id: params.id },
    })

    if (!image) {
      return new Response(JSON.stringify({ error: 'Image not found' }), {
        status: 404,
      })
    }

    // Delete from Vercel Blob using the pathname
    await del(image.blobId)

    // Delete from database
    await prisma.image.delete({
      where: { id: params.id },
    })

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (error) {
    console.error('Error deleting image:', error)
    return new Response(JSON.stringify({ error: 'Failed to delete image' }), {
      status: 500,
    })
  }
}
