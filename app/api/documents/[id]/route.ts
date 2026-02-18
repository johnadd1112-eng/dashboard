import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

// DELETE /api/documents/[id]
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const doc = await prisma.document.findUnique({ where: { id } })

    if (!doc) {
        return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    if (doc.userId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.document.delete({ where: { id } })

    return NextResponse.json({ success: true })
}
