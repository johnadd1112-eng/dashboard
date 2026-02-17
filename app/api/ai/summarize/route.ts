import { NextResponse } from "next/server"
export const dynamic = "force-dynamic"
import ytdl from "@distube/ytdl-core"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { parseStringPromise } from "xml2js"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(req: Request) {
    try {
        const { url, text: manualText } = await req.json()

        let transcriptText = manualText || ""

        if (!transcriptText) {
            if (!url) {
                return NextResponse.json({ error: "YouTube URL or manual transcript text is required" }, { status: 400 })
            }

            // Extract video ID
            let videoId = ""
            try {
                videoId = ytdl.getVideoID(url)
            } catch (e) {
                return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 })
            }

            console.log("Fetcher - Processing Video ID:", videoId)

            // Get Metadata
            try {
                const info = await ytdl.getInfo(videoId)
                const captionTracks = info.player_response?.captions?.playerCaptionsTracklistRenderer?.captionTracks

                if (captionTracks && captionTracks.length > 0) {
                    const track = captionTracks.find((t: any) => t.languageCode === "en") || captionTracks[0]
                    const transcriptUrl = track.baseUrl

                    const transcriptRes = await fetch(transcriptUrl, {
                        headers: {
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
                        }
                    })

                    if (transcriptRes.ok) {
                        const xmlContent = await transcriptRes.text()
                        const parsed = await parseStringPromise(xmlContent)
                        if (parsed.transcript && parsed.transcript.text) {
                            transcriptText = parsed.transcript.text
                                .map((node: any) => node._ || "")
                                .join(" ")
                                .replace(/&#39;/g, "'")
                                .replace(/&quot;/g, '"')
                        }
                    }
                }
            } catch (err) {
                console.error("Auto extraction failed:", err)
            }
        }

        if (!transcriptText || transcriptText.length < 50) {
            return NextResponse.json({
                error: "Could not extract transcript automatically. Please paste the transcript manually below.",
                needsManual: true
            }, { status: 400 })
        }

        console.log("Total chars for summary:", transcriptText.length)

        // AI Processing
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

        const prompt = `
            You are an expert study assistant. Create a high-quality, structured study guide from this content.
            
            Use Markdown:
            # Study Notes & Summary
            
            ## 📝 Executive Summary
            One solid paragraph summarizing everything.
            
            ## 💡 Key Lessons
            Main takeaways and concepts.
            
            ## 📓 Structured Notes
            Detailed notes organized by topic.
            
            ## 🏁 Conclusion
            Final thoughts.

            Content:
            ${transcriptText.substring(0, 50000)}
        `

        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        return NextResponse.json({ summary: text })

    } catch (error: any) {
        console.error("AI Route Error:", error)
        return NextResponse.json({ error: "AI error: " + (error.message || "Unknown error") }, { status: 500 })
    }
}
