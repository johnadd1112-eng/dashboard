import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

// GET /api/workspaces — list user's workspaces
export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const workspaces = await prisma.workspace.findMany({
        where: { userId: session.user.id },
        include: {
            _count: {
                select: { documents: true }
            }
        },
        orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ workspaces })
}

// POST /api/workspaces — create a new workspace
export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { name } = await req.json()

        if (!name || name.trim().length < 2) {
            return NextResponse.json({ error: "Workspace name must be at least 2 characters." }, { status: 400 })
        }

        const workspace = await prisma.workspace.create({
            data: {
                name: name.trim(),
                userId: session.user.id,
            },
        })

        return NextResponse.json({ workspace })
    } catch (error: any) {
        console.error("Workspace creation error:", error)
        return NextResponse.json({ error: "Failed to create workspace: " + (error.message || "Unknown error") }, { status: 500 })
    }
}
