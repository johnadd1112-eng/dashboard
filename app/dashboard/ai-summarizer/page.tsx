"use client"

import { useState } from "react"
import ReactMarkdown from "react-markdown"

export default function AISummarizerPage() {
    const [url, setUrl] = useState("")
    const [manualText, setManualText] = useState("")
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [showManual, setShowManual] = useState(false)

    const handleSummarize = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setResult(null)

        try {
            const response = await fetch("/api/ai/summarize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url, text: manualText }),
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.error || "Failed to generate summary")
                if (data.needsManual) {
                    setShowManual(true)
                }
            } else {
                setResult(data.summary)
                setShowManual(false)
            }
        } catch (err) {
            setError("Could not connect to the AI service. Please try again later.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
                    <h1 className="text-3xl font-bold mb-2">AI YouTube Summarizer</h1>
                    <p className="text-indigo-100 italic">Paste a link or transcript, get structured study notes instantly.</p>
                </div>

                <div className="p-8">
                    <form onSubmit={handleSummarize} className="space-y-6 mb-8">
                        <div className="flex gap-4">
                            <input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="Paste YouTube Video Link here..."
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-gray-800"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className={`px-8 py-3 rounded-xl font-semibold text-white transition shadow-lg ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 active:scale-95"
                                    }`}
                            >
                                {loading ? "Processing..." : "Generate Notes"}
                            </button>
                        </div>

                        {showManual && (
                            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Automatic extraction failed. Please paste the video transcript here:
                                </label>
                                <textarea
                                    value={manualText}
                                    onChange={(e) => setManualText(e.target.value)}
                                    rows={8}
                                    placeholder="Paste transcript content from YouTube here..."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-gray-800 font-mono text-sm"
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !manualText}
                                    className="mt-4 w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition"
                                >
                                    Summarize Pasted Text
                                </button>
                            </div>
                        )}
                    </form>

                    {error && (
                        <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center">
                            <span className="mr-2 italic text-lg font-bold">⚠️</span>
                            {error}
                        </div>
                    )}

                    {loading && (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
                            <p className="text-gray-600 font-medium">Analyzing transcript and crafting your notes... This may take 15-30 seconds.</p>
                        </div>
                    )}

                    {result && !loading && (
                        <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 animate-in fade-in slide-in-from-bottom-4">
                            <div className="prose prose-indigo max-w-none text-gray-800">
                                <ReactMarkdown
                                    components={{
                                        h1: ({ node, ...props }: any) => <h1 className="text-3xl font-bold border-b pb-4 mb-6 text-indigo-800" {...props} />,
                                        h2: ({ node, ...props }: any) => <h2 className="text-2xl font-semibold mt-8 mb-4 text-indigo-700" {...props} />,
                                        h3: ({ node, ...props }: any) => <h3 className="text-xl font-medium mt-6 mb-3 text-indigo-600" {...props} />,
                                        p: ({ node, ...props }: any) => <p className="mb-4 leading-relaxed" {...props} />,
                                        ul: ({ node, ...props }: any) => <ul className="list-disc list-outside ml-6 mb-4 space-y-2 font-light" {...props} />,
                                        li: ({ node, ...props }: any) => <li className="pl-1" {...props} />,
                                    }}
                                >
                                    {result}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
