"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function WorkspacesPage() {
    const [workspaces, setWorkspaces] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [newWorkspaceName, setNewWorkspaceName] = useState("")
    const [creating, setCreating] = useState(false)
    const router = useRouter()

    useEffect(() => {
        fetchWorkspaces()
    }, [])

    const fetchWorkspaces = async () => {
        try {
            const res = await fetch("/api/workspaces")
            const data = await res.json()
            if (data.workspaces) {
                setWorkspaces(data.workspaces)
            }
        } catch (error) {
            console.error("Failed to fetch workspaces", error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateWorkspace = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newWorkspaceName.trim()) return

        setCreating(true)
        try {
            const res = await fetch("/api/workspaces", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newWorkspaceName })
            })
            const data = await res.json()
            if (res.ok) {
                setNewWorkspaceName("")
                fetchWorkspaces()
                // Optionally redirect
                // router.push(`/dashboard/workspaces/${data.workspace.id}`)
            } else {
                alert(data.error || "Failed to create workspace")
            }
        } catch (error) {
            alert("An error occurred")
        } finally {
            setCreating(false)
        }
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                        AI Workspaces
                    </h1>
                    <p className="mt-2 text-gray-600 font-medium">
                        Organize your documents and ask questions across multiple files.
                    </p>
                </div>

                <form onSubmit={handleCreateWorkspace} className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Workspace Name..."
                        className="px-4 py-3 rounded-xl border border-indigo-100 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none min-w-[240px]"
                        value={newWorkspaceName}
                        onChange={(e) => setNewWorkspaceName(e.target.value)}
                        disabled={creating}
                    />
                    <button
                        type="submit"
                        disabled={creating}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {creating ? "Creating..." : "Create Workspace"}
                    </button>
                </form>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 rounded-2xl bg-gray-100 animate-pulse" />
                    ))}
                </div>
            ) : workspaces.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-3xl shadow-sm border border-gray-100">
                    <div className="text-6xl mb-4">📂</div>
                    <h3 className="text-2xl font-bold text-gray-800">No workspaces yet</h3>
                    <p className="text-gray-500 mt-2">Create your first workspace to start organizing your documents.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {workspaces.map((workspace) => (
                        <Link
                            key={workspace.id}
                            href={`/dashboard/workspaces/${workspace.id}`}
                            className="group relative bg-white rounded-3xl border border-gray-100 p-8 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
                        >
                            <div className="absolute top-0 right-0 p-6 text-4xl group-hover:rotate-12 transition-transform">
                                🚀
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2 truncate pr-12">
                                {workspace.name}
                            </h2>
                            <div className="flex items-center text-sm text-gray-500 font-medium bg-gray-50 w-fit px-3 py-1 rounded-full">
                                <span className="mr-2">📄</span>
                                {workspace._count?.documents || 0} Documents
                            </div>
                            <div className="mt-8 flex items-center text-indigo-600 font-bold group-hover:gap-2 transition-all">
                                Open Workspace
                                <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
