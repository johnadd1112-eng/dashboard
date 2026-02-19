import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { authOptions } from "@/lib/auth"

export default async function DashboardPage() {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect("/login")
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="bg-white rounded-2xl shadow-xl p-8">
                <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Welcome, {session.user.name || session.user.email}!
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Account Status</h3>
                        <p className="text-3xl font-bold text-indigo-600">{session.user.status}</p>
                    </div>

                    <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Your Role</h3>
                        <p className="text-3xl font-bold text-purple-600">{session.user.role}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <Link
                        href="/dashboard/ai-summarizer"
                        className="group p-8 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-3xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition duration-300 text-white"
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold mb-2 flex items-center">
                                    ✨ Video Summarizer
                                </h2>
                                <p className="text-indigo-100/80 text-sm">
                                    Convert YouTube videos into structured study notes instantly.
                                </p>
                            </div>
                            <div className="text-4xl group-hover:scale-110 transition duration-300 ml-4">
                                📝
                            </div>
                        </div>
                    </Link>

                    <Link
                        href="/dashboard/workspaces"
                        className="group p-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition duration-300 text-white"
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold mb-2 flex items-center">
                                    📂 AI Workspaces
                                    <span className="ml-3 text-[10px] bg-white/20 px-2 py-0.5 rounded-full animate-pulse uppercase tracking-widest font-bold">Pro</span>
                                </h2>
                                <p className="text-purple-100/80 text-sm">
                                    Ask questions across multiple documents and search the web.
                                </p>
                            </div>
                            <div className="text-4xl group-hover:scale-110 transition duration-300 ml-4">
                                🚀
                            </div>
                        </div>
                    </Link>

                    <Link
                        href="/dashboard/doc-qa"
                        className="group p-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-3xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition duration-300 text-white"
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold mb-2 flex items-center">
                                    📄 Doc Q&amp;A
                                </h2>
                                <p className="text-violet-100/80 text-sm">
                                    Quick analysis for individual PDF or text files.
                                </p>
                            </div>
                            <div className="text-4xl group-hover:scale-110 transition duration-300 ml-4">
                                🤖
                            </div>
                        </div>
                    </Link>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Dashboard Features</h2>
                    <ul className="space-y-3">
                        <li className="flex items-start">
                            <span className="text-green-500 mr-3 text-xl">✓</span>
                            <span className="text-gray-700">Access to your personal dashboard</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-green-500 mr-3 text-xl">✓</span>
                            <span className="text-gray-700">View your account information</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-green-500 mr-3 text-xl">✓</span>
                            <span className="text-gray-700">Secure authentication and session management</span>
                        </li>
                        {session.user.role === "ADMIN" && (
                            <li className="flex items-start">
                                <span className="text-green-500 mr-3 text-xl">✓</span>
                                <span className="text-gray-700 font-semibold">Admin access to user management</span>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    )
}
