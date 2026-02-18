"use client"

import { signOut, useSession } from "next-auth/react"
import Link from "next/link"

export default function Navbar() {
    const { data: session } = useSession()

    return (
        <nav className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-8">
                        <Link href="/" className="text-2xl font-bold hover:text-indigo-200 transition">
                            Dashboard
                        </Link>
                        {session && (
                            <div className="flex space-x-4">
                                {session.user.role === "ADMIN" && (
                                    <Link
                                        href="/admin"
                                        className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
                                    >
                                        Admin Panel
                                    </Link>
                                )}
                                <Link
                                    href="/dashboard"
                                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
                                >
                                    My Dashboard
                                </Link>
                                <Link
                                    href="/dashboard/ai-summarizer"
                                    className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition font-semibold animate-pulse shadow-inner"
                                >
                                    ✨ AI YouTube Tool
                                </Link>
                                <Link
                                    href="/dashboard/doc-qa"
                                    className="px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-400 transition font-semibold shadow-inner"
                                >
                                    📄 Doc Q&A
                                </Link>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center space-x-4">
                        {session ? (
                            <>
                                <span className="text-sm">
                                    {session.user.email}
                                    <span className="ml-2 px-2 py-1 text-xs rounded-full bg-white/20">
                                        {session.user.role}
                                    </span>
                                </span>
                                <button
                                    onClick={() => signOut({ callbackUrl: "/login" })}
                                    className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 transition font-medium"
                                >
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/signup"
                                    className="px-4 py-2 rounded-lg bg-white text-indigo-600 hover:bg-indigo-50 transition font-medium"
                                >
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}
