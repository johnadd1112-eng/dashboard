"use client"

import { useState, useEffect, useRef } from "react"
import ReactMarkdown from "react-markdown"

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
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}

function FileIcon({ mimeType }: { mimeType: string }) {
    if (mimeType === "application/pdf") {
        return <span className="text-red-500 text-xl">📄</span>
    }
    return <span className="text-blue-500 text-xl">📝</span>
}

export default function DocQAPage() {
    const [documents, setDocuments] = useState<Document[]>([])
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [question, setQuestion] = useState("")
    const [uploading, setUploading] = useState(false)
    const [asking, setAsking] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [askError, setAskError] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const chatEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetchDocuments()
    }, [])

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    async function fetchDocuments() {
        try {
            const res = await fetch("/api/documents")
            if (res.ok) {
                const data = await res.json()
                setDocuments(data.documents)
            }
        } catch (e) {
            console.error("Failed to fetch documents", e)
        }
    }

    async function handleUpload(file: File) {
        setUploading(true)
        setUploadError(null)

        const formData = new FormData()
        formData.append("file", file)

        try {
            const res = await fetch("/api/documents", {
                method: "POST",
                body: formData,
            })
            const data = await res.json()
            if (!res.ok) {
                setUploadError(data.error || "Upload failed")
            } else {
                setDocuments((prev) => [data.document, ...prev])
                setSelectedDoc(data.document)
                setMessages([])
            }
        } catch (e) {
            setUploadError("Network error. Please try again.")
        } finally {
            setUploading(false)
        }
    }

    async function handleDelete(docId: string) {
        try {
            const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" })
            if (res.ok) {
                setDocuments((prev) => prev.filter((d) => d.id !== docId))
                if (selectedDoc?.id === docId) {
                    setSelectedDoc(null)
                    setMessages([])
                }
            }
        } catch (e) {
            console.error("Delete failed", e)
        }
    }

    async function handleAsk(e: React.FormEvent) {
        e.preventDefault()
        if (!question.trim() || !selectedDoc || asking) return

        const userQuestion = question.trim()
        setQuestion("")
        setAskError(null)
        setMessages((prev) => [...prev, { role: "user", content: userQuestion }])
        setAsking(true)

        try {
            const res = await fetch(`/api/documents/${selectedDoc.id}/ask`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: userQuestion }),
            })
            const data = await res.json()
            if (!res.ok) {
                setAskError(data.error || "Failed to get answer")
                setMessages((prev) => prev.slice(0, -1))
            } else {
                setMessages((prev) => [...prev, { role: "assistant", content: data.answer }])
            }
        } catch (e) {
            setAskError("Network error. Please try again.")
            setMessages((prev) => prev.slice(0, -1))
        } finally {
            setAsking(false)
        }
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) handleUpload(file)
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (file) handleUpload(file)
        e.target.value = ""
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-8 text-white mb-8 shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="text-5xl">📄</div>
                    <div>
                        <h1 className="text-3xl font-bold mb-1">Doc Q&amp;A</h1>
                        <p className="text-violet-200">Upload a PDF or text file, then ask questions about it using AI.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Panel: Upload + Document List */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Upload Zone */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span>⬆️</span> Upload Document
                        </h2>

                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${isDragging
                                    ? "border-violet-500 bg-violet-50 scale-[1.02]"
                                    : "border-gray-300 hover:border-violet-400 hover:bg-violet-50"
                                }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.txt,.md,.csv"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            {uploading ? (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-violet-600 border-t-transparent" />
                                    <p className="text-violet-600 font-medium">Extracting text...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="text-4xl mb-3">📁</div>
                                    <p className="text-gray-600 font-medium">Drop file here or click to browse</p>
                                    <p className="text-gray-400 text-sm mt-1">PDF, TXT, MD, CSV — max 10MB</p>
                                </>
                            )}
                        </div>

                        {uploadError && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-center gap-2">
                                <span>⚠️</span> {uploadError}
                            </div>
                        )}
                    </div>

                    {/* Document List */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span>📚</span> My Documents
                            <span className="ml-auto text-sm font-normal text-gray-400">{documents.length} file{documents.length !== 1 ? "s" : ""}</span>
                        </h2>

                        {documents.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <div className="text-3xl mb-2">🗂️</div>
                                <p className="text-sm">No documents yet. Upload one to get started!</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                                {documents.map((doc) => (
                                    <div
                                        key={doc.id}
                                        onClick={() => { setSelectedDoc(doc); setMessages([]); setAskError(null) }}
                                        className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-150 ${selectedDoc?.id === doc.id
                                                ? "bg-violet-50 border-2 border-violet-300"
                                                : "hover:bg-gray-50 border-2 border-transparent"
                                            }`}
                                    >
                                        <FileIcon mimeType={doc.mimeType} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                                            <p className="text-xs text-gray-400">{formatFileSize(doc.size)}</p>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(doc.id) }}
                                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all p-1 rounded-lg hover:bg-red-50"
                                            title="Delete document"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Chat Interface */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col" style={{ minHeight: "600px" }}>
                        {/* Chat Header */}
                        <div className={`p-5 border-b border-gray-100 ${selectedDoc ? "bg-gradient-to-r from-violet-50 to-indigo-50" : "bg-gray-50"}`}>
                            {selectedDoc ? (
                                <div className="flex items-center gap-3">
                                    <FileIcon mimeType={selectedDoc.mimeType} />
                                    <div>
                                        <p className="font-semibold text-gray-800">{selectedDoc.name}</p>
                                        <p className="text-xs text-gray-500">{formatFileSize(selectedDoc.size)} · Click a document on the left to switch</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm text-center">← Select or upload a document to start asking questions</p>
                            )}
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ maxHeight: "450px" }}>
                            {messages.length === 0 && selectedDoc && (
                                <div className="text-center py-12 text-gray-400">
                                    <div className="text-5xl mb-4">💬</div>
                                    <p className="font-medium text-gray-500">Ask anything about <span className="text-violet-600">{selectedDoc.name}</span></p>
                                    <p className="text-sm mt-1">The AI will find relevant content and answer your question.</p>
                                </div>
                            )}

                            {messages.length === 0 && !selectedDoc && (
                                <div className="text-center py-16 text-gray-400">
                                    <div className="text-6xl mb-4">🤖</div>
                                    <p className="font-medium">Your AI document assistant is ready</p>
                                    <p className="text-sm mt-1">Upload a document and start asking questions!</p>
                                </div>
                            )}

                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                    {msg.role === "assistant" && (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-sm mr-3 mt-1 flex-shrink-0">
                                            🤖
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[80%] rounded-2xl px-5 py-3 ${msg.role === "user"
                                                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-tr-sm"
                                                : "bg-gray-50 border border-gray-100 text-gray-800 rounded-tl-sm"
                                            }`}
                                    >
                                        {msg.role === "assistant" ? (
                                            <div className="prose prose-sm max-w-none text-gray-800">
                                                <ReactMarkdown
                                                    components={{
                                                        p: ({ node, ...props }: any) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                                                        ul: ({ node, ...props }: any) => <ul className="list-disc list-outside ml-4 mb-2 space-y-1" {...props} />,
                                                        ol: ({ node, ...props }: any) => <ol className="list-decimal list-outside ml-4 mb-2 space-y-1" {...props} />,
                                                        li: ({ node, ...props }: any) => <li className="pl-1" {...props} />,
                                                        strong: ({ node, ...props }: any) => <strong className="font-semibold text-violet-700" {...props} />,
                                                        code: ({ node, ...props }: any) => <code className="bg-gray-200 px-1 rounded text-sm font-mono" {...props} />,
                                                    }}
                                                >
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                        ) : (
                                            <p className="text-sm leading-relaxed">{msg.content}</p>
                                        )}
                                    </div>
                                    {msg.role === "user" && (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-sm ml-3 mt-1 flex-shrink-0">
                                            👤
                                        </div>
                                    )}
                                </div>
                            ))}

                            {asking && (
                                <div className="flex justify-start">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-sm mr-3 mt-1 flex-shrink-0">
                                        🤖
                                    </div>
                                    <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex gap-1">
                                                <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                                <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                                <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                            </div>
                                            <span className="text-gray-400 text-sm">Analyzing document...</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {askError && (
                                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-center gap-2">
                                    <span>⚠️</span> {askError}
                                </div>
                            )}

                            <div ref={chatEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50">
                            <form onSubmit={handleAsk} className="flex gap-3">
                                <input
                                    type="text"
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    placeholder={selectedDoc ? `Ask a question about "${selectedDoc.name}"...` : "Select a document first..."}
                                    disabled={!selectedDoc || asking}
                                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition text-gray-800 bg-white disabled:bg-gray-100 disabled:text-gray-400 text-sm"
                                />
                                <button
                                    type="submit"
                                    disabled={!selectedDoc || !question.trim() || asking}
                                    className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-violet-700 hover:to-indigo-700 active:scale-95 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center gap-2"
                                >
                                    {asking ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <span>✨</span>
                                    )}
                                    Ask
                                </button>
                            </form>
                            {messages.length > 0 && (
                                <button
                                    onClick={() => setMessages([])}
                                    className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition"
                                >
                                    Clear conversation
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
