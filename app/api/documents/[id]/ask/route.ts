import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Groq from "groq-sdk"

export const dynamic = "force-dynamic"

// Groq client is instantiated inside the handler to avoid build-time errors when ENV is missing

// Split text into overlapping chunks for better context coverage
function chunkText(text: string, chunkSize = 600, overlap = 100): string[] {
    const chunks: string[] = []
    let start = 0
    while (start < text.length) {
        chunks.push(text.slice(start, start + chunkSize))
        start += chunkSize - overlap
    }
    return chunks
}

// Score a chunk by keyword overlap with the question
function scoreChunk(chunk: string, question: string): number {
    const questionWords = question
        .toLowerCase()
        .split(/\W+/)
        .filter((w) => w.length > 3)

    const chunkLower = chunk.toLowerCase()
    return questionWords.reduce((score, word) => {
        // Count occurrences for better scoring
        const regex = new RegExp(word, "g")
        const matches = chunkLower.match(regex)
        return score + (matches ? matches.length : 0)
    }, 0)
}

// POST /api/documents/[id]/ask
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === "your_groq_api_key_here") {
        return NextResponse.json({
            error: "Groq API key not configured. Please add your GROQ_API_KEY to .env.local (get a free key at console.groq.com)."
        }, { status: 503 })
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    try {
        const { question } = await req.json()
        const { id } = await params

        if (!question || question.trim().length < 3) {
            return NextResponse.json({ error: "Please provide a valid question." }, { status: 400 })
        }

        const doc = await prisma.document.findUnique({ where: { id } })

        if (!doc) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 })
        }

        if (doc.userId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        // Find the most relevant chunks
        const chunks = chunkText(doc.content)
        const scored = chunks
            .map((chunk, i) => ({ chunk, score: scoreChunk(chunk, question), index: i }))
            .sort((a, b) => b.score - a.score)

        // Take top 5 chunks (by score), then re-sort by original position for coherent context
        const topChunks = scored
            .slice(0, 5)
            .sort((a, b) => a.index - b.index)
            .map((c) => c.chunk)

        const context = topChunks.join("\n\n---\n\n")

        const prompt = `You are a helpful document assistant. Answer the user's question based ONLY on the provided document context. 
If the answer is not found in the context, say "I couldn't find information about that in this document."
Be concise, clear, and accurate. Use bullet points or numbered lists when helpful.

Document: "${doc.name}"

Relevant Context:
${context}

Question: ${question}

Answer:`

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 1024,
            temperature: 0.3,
        })

        const answer = completion.choices[0]?.message?.content || "No answer generated."

        return NextResponse.json({ answer, documentName: doc.name })
    } catch (error: any) {
        console.error("Doc Q&A error:", error)
        return NextResponse.json({ error: "AI error: " + (error.message || "Unknown error") }, { status: 500 })
    }
}
