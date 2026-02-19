"use client"

import { useState, useEffect, useRef, use } from "react"
import ReactMarkdown from "react-markdown"
import Link from "next/link"

interface Document {
    id: string
    name: string
    size: number
    mimeType: string
    createdAt: string
}

interface Message {
    role: "user" | "assistant"
    content: string
    sources?: string[]
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}

export default function WorkspaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: workspaceId } = use(params)
    const [workspace, setWorkspace] = useState<any>(null)
    const [documents, setDocuments] = useState<Document[]>([])
    const [messages, setMessages] = useState<Message[]>([])
    const [question, setQuestion] = useState("")
    const [uploading, setUploading] = useState(false)
    const [asking, setAsking] = useState(false)
    const [deepSearch, setDeepSearch] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)
    const chatEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetchWorkspace()
    }, [workspaceId])

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, asking])

    const fetchWorkspace = async () => {
        try {
            // Reusing the list/get logic from the API
            const res = await fetch("/api/workspaces")
            const data = await res.json()
            const ws = data.workspaces?.find((w: any) => w.id === workspaceId)
            if (ws) {
                setWorkspace(ws)
                // Fetch docs for this workspace
                const docsRes = await fetch("/api/documents")
                const docsData = await docsRes.json()
                setDocuments(docsData.documents?.filter((d: any) => d.workspaceId === workspaceId) || [])
            }
        } catch (err) {
            setError("Failed to load workspace")
        }
    }

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        const formData = new FormData()
        formData.append("file", file)
        formData.append("workspaceId", workspaceId)

        try {
            const res = await fetch("/api/documents", {
                method: "POST",
                body: formData
            })
            const data = await res.json()
            if (res.ok) {
                setDocuments(prev => [data.document, ...prev])
            } else {
                alert(data.error || "Upload failed")
            }
        } catch (err) {
            alert("Upload failed")
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    const handleAsk = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!question.trim() || asking) return

        const userMsg = question.trim()
        setQuestion("")
        setMessages(prev => [...prev, { role: "user", content: userMsg }])
        setAsking(true)

        try {
            const res = await fetch(`/api/workspaces/${workspaceId}/ask`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: userMsg, deepSearch })
            })
            const data = await res.json()
            if (res.ok) {
                setMessages(prev => [...prev, { role: "assistant", content: data.answer, sources: data.sources }])
            } else {
                setMessages(prev => [...prev, { role: "assistant", content: `Error: ${data.error || "Failed to get response"}` }])
            }
        } catch (err) {
            setMessages(prev => [...prev, { role: "assistant", content: "Network error occurred." }])
        } finally {
            setAsking(false)
        }
    }

    if (!workspace) return <div className="p-12 text-center">Loading workspace...</div>

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 h-[calc(100vh-120px)] flex flex-col">
            {/* Header Area */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/workspaces" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">{workspace.name}</h1>
                        <p className="text-sm text-gray-500 font-medium">{documents.length} Documents in this workspace</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <label className="flex items-center cursor-pointer group">
                        <div className={`mr-3 text-sm font-bold ${deepSearch ? "text-orange-500" : "text-gray-400"} transition-colors`}>
                            🔥 Deep Search
                        </div>
                        <div className="relative">
                            <input
                                type="checkbox"
                                className="sr-only"
                                checked={deepSearch}
                                onChange={() => setDeepSearch(!deepSearch)}
                            />
                            <div className={`block w-14 h-8 rounded-full transition-colors ${deepSearch ? "bg-orange-500" : "bg-gray-300"}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-200 ${deepSearch ? "translate-x-6" : ""}`}></div>
                        </div>
                    </label>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                    >
                        {uploading ? "Uploading..." : <><span className="text-lg">+</span> Add Docs</>}
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" />
                </div>
            </div>

            <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Document Sidebar (left) */}
                <div className="hidden lg:block lg:col-span-1 bg-gray-50/50 rounded-3xl p-6 border border-gray-100 overflow-y-auto">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Workspace Files</h3>
                    <div className="space-y-3">
                        {documents.map(doc => (
                            <div key={doc.id} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm group hover:border-indigo-200 hover:shadow-md transition-all">
                                <div className="text-sm font-bold text-gray-800 truncate mb-1">{doc.name}</div>
                                <div className="text-xs text-gray-400 font-medium uppercase tracking-tight">{formatFileSize(doc.size)}</div>
                            </div>
                        ))}
                        {documents.length === 0 && (
                            <div className="py-12 text-center text-gray-400">
                                <p className="text-xs font-bold italic">No documents yet.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Area (right) */}
                <div className="lg:col-span-3 flex flex-col bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-8 space-y-6">
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center py-20">
                                <div className="text-7xl mb-6 animate-bounce">🤖</div>
                                <h3 className="text-3xl font-extrabold text-gray-800 mb-2">Workspace Brain Active</h3>
                                <p className="text-gray-500 max-w-md">
                                    I will search across all {documents.length} documents to find the best answer for you.
                                    {deepSearch && " Web searching is also enabled!"}
                                </p>
                            </div>
                        )}

                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[85%] rounded-3xl px-6 py-4 shadow-sm ${msg.role === "user"
                                        ? "bg-indigo-600 text-white rounded-tr-none"
                                        : "bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200/50"
                                    }`}>
                                    <div className="prose prose-sm max-w-none prose-indigo">
                                        <ReactMarkdown
                                            components={{
                                                p: ({ node, ...props }: any) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                                                strong: ({ node, ...props }: any) => <strong className="font-bold text-indigo-500" {...props} />,
                                            }}
                                        >
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>

                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-gray-200/30">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Sources Referenced:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {msg.sources.map((src, idx) => (
                                                    <span key={idx} className="text-[10px] bg-white/50 px-2 py-1 rounded-lg border border-gray-200 text-gray-600 font-bold truncate max-w-[150px]">
                                                        {src.startsWith('http') ? '🌐 Web Result' : `📄 ${src}`}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {asking && (
                            <div className="flex justify-start">
                                <div className="bg-gray-50 border border-gray-200 rounded-3xl rounded-tl-none px-6 py-4 flex items-center gap-3">
                                    <div className="flex gap-1.5">
                                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse delay-75" />
                                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse delay-150" />
                                    </div>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Searching Knowledge Base...</span>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input */}
                    <div className="p-6 bg-gray-50/50 border-t border-gray-100">
                        <form onSubmit={handleAsk} className="relative flex items-center">
                            <input
                                type="text"
                                placeholder={`Ask anything across this workspace...`}
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                disabled={asking}
                                className="w-full pl-6 pr-16 py-4 bg-white border border-gray-200 rounded-2xl shadow-inner focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-800 disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={!question.trim() || asking}
                                className="absolute right-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50"
                            >
                                {asking ? "..." : "Send"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
