import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Groq from "groq-sdk"

export const dynamic = "force-dynamic"

// Helper: Split text into overlapping chunks
function chunkText(text: string, sourceName: string, chunkSize = 800, overlap = 150) {
    const chunks: { text: string; source: string }[] = []
    let start = 0
    while (start < text.length) {
        chunks.push({
            text: text.slice(start, start + chunkSize),
            source: sourceName
        })
        start += chunkSize - overlap
    }
    return chunks
}

// Helper: Score a chunk by keyword overlap
function scoreChunk(chunk: string, question: string): number {
    const questionWords = question
        .toLowerCase()
        .split(/\W+/)
        .filter((w) => w.length > 3)

    const chunkLower = chunk.toLowerCase()
    return questionWords.reduce((score, word) => {
        const regex = new RegExp(word, "g")
        const matches = chunkLower.match(regex)
        return score + (matches ? matches.length : 0)
    }, 0)
}

// POST /api/workspaces/[id]/ask
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!process.env.GROQ_API_KEY) {
        return NextResponse.json({ error: "Groq API key not configured." }, { status: 503 })
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    try {
        const { question, deepSearch = false } = await req.json()
        const { id: workspaceId } = await params

        if (!question || question.trim().length < 3) {
            return NextResponse.json({ error: "Please provide a valid question." }, { status: 400 })
        }

        // 1. Verify workspace and get all documents
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId, userId: session.user.id },
            include: { documents: true }
        })

        if (!workspace) {
            return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
        }

        if (workspace.documents.length === 0) {
            return NextResponse.json({ error: "No documents found in this workspace. Please upload some files first." }, { status: 400 })
        }

        // 2. Chunks from all documents
        let allChunks: { text: string; source: string }[] = []
        workspace.documents.forEach(doc => {
            allChunks = allChunks.concat(chunkText(doc.content, doc.name))
        })

        // 3. RAG: Search across all documents
        const scored = allChunks
            .map((chunk) => ({ ...chunk, score: scoreChunk(chunk.text, question) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 10) // Take top 10 chunks from across all docs

        let context = scored.map(c => `[Source: ${c.source}]\n${c.text}`).join("\n\n---\n\n")

        // 3.5 Deep Search with Firecrawl
        let webSources: { url: string; title: string }[] = []
        if (deepSearch && process.env.FIRECRAWL_API_KEY) {
            try {
                // Search for relevant URLs
                const searchRes = await fetch("https://api.firecrawl.dev/v1/search", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${process.env.FIRECRAWL_API_KEY}`
                    },
                    body: JSON.stringify({
                        query: question,
                        limit: 3,
                        lang: "en"
                    })
                })

                if (searchRes.ok) {
                    const searchData = await searchRes.json()
                    if (searchData.success && searchData.data?.length > 0) {
                        const topResults = searchData.data.slice(0, 2)

                        // Scrape top 2 results
                        const scrapePromises = topResults.map((res: any) =>
                            fetch("https://api.firecrawl.dev/v1/scrape", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    "Authorization": `Bearer ${process.env.FIRECRAWL_API_KEY}`
                                },
                                body: JSON.stringify({ url: res.url, formats: ["markdown"] })
                            }).then(r => r.json())
                        )

                        const scrapes = await Promise.all(scrapePromises)
                        let webContext = ""

                        scrapes.forEach((scrape, idx) => {
                            if (scrape.success && scrape.data?.markdown) {
                                const title = topResults[idx].title || topResults[idx].url
                                webContext += `[Source: Web - ${title} (${topResults[idx].url})]\n${scrape.data.markdown.substring(0, 3000)}\n\n`
                                webSources.push({ url: topResults[idx].url, title })
                            }
                        })

                        if (webContext) {
                            context += `\n\n---\n\nWEB SEARCH RESULTS:\n${webContext}`
                        }
                    }
                }
            } catch (err) {
                console.error("Firecrawl error:", err)
                // Continue with just document context if web search fails
            }
        }

        // 4. Prompt construction
        const prompt = `You are a helpful workspace assistant. Answer the user's question based on the provided documents and search results.
Structure your answer clearly and cite the sources using the names provided in brackets like [Source: filename.pdf] or [Source: Web - Title (URL)].
If the answer is not in the provided context, state that clearly.

Workspace: "${workspace.name}"

Context:
${context}

Question: ${question}

Answer (with citations):`

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 2048,
            temperature: 0.3,
        })

        const answer = completion.choices[0]?.message?.content || "No answer generated."

        return NextResponse.json({
            answer,
            workspaceName: workspace.name,
            sources: [
                ...Array.from(new Set(scored.map(s => s.source))),
                ...webSources.map(w => w.url)
            ]
        })

    } catch (error: any) {
        console.error("Workspace Q&A error:", error)
        return NextResponse.json({ error: "AI error: " + (error.message || "Unknown error") }, { status: 500 })
    }
}
