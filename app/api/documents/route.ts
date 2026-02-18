import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

// GET /api/documents — list user's documents
export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const documents = await prisma.document.findMany({
        where: { userId: session.user.id },
        select: { id: true, name: true, size: true, mimeType: true, createdAt: true },
        orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ documents })
}

// POST /api/documents — upload a file
export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const formData = await req.formData()
        const file = formData.get("file") as File | null

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 })
        }

        const allowedTypes = [
            "application/pdf",
            "text/plain",
            "text/markdown",
            "text/csv",
        ]
        if (!allowedTypes.includes(file.type) && !file.name.endsWith(".txt") && !file.name.endsWith(".md")) {
            return NextResponse.json({ error: "Only PDF and text files are supported" }, { status: 400 })
        }

        const maxSize = 10 * 1024 * 1024 // 10MB
        if (file.size > maxSize) {
            return NextResponse.json({ error: "File too large. Maximum size is 10MB." }, { status: 400 })
        }

        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        let content = ""

        if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
            // unpdf works in Node.js without browser DOM APIs
            const { extractText } = await import("unpdf")
            const pdfData = await extractText(new Uint8Array(arrayBuffer), { mergePages: true })
            content = pdfData.text
        } else {
            // Plain text / markdown / csv
            content = buffer.toString("utf-8")
        }

        if (!content || content.trim().length < 10) {
            return NextResponse.json({ error: "Could not extract text from the file. Please ensure it contains readable text." }, { status: 400 })
        }

        const document = await prisma.document.create({
            data: {
                userId: session.user.id,
                name: file.name,
                content: content.substring(0, 500000), // cap at 500k chars
                size: file.size,
                mimeType: file.type || "text/plain",
            },
        })

        return NextResponse.json({
            document: {
                id: document.id,
                name: document.name,
                size: document.size,
                mimeType: document.mimeType,
                createdAt: document.createdAt,
            }
        })
    } catch (error: any) {
        console.error("Document upload error:", error)
        return NextResponse.json({ error: "Upload failed: " + (error.message || "Unknown error") }, { status: 500 })
    }
}
