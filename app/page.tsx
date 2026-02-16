import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
      <div className="text-center max-w-3xl">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
          Welcome to Your Dashboard
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          A secure, role-based dashboard with admin approval workflow
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/signup"
            className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-xl transition transform hover:-translate-y-1"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 bg-white text-indigo-600 rounded-lg font-semibold border-2 border-indigo-600 hover:bg-indigo-50 transition"
          >
            Sign In
          </Link>
        </div>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition">
            <div className="text-4xl mb-4">🔐</div>
            <h3 className="text-xl font-bold mb-2">Secure Authentication</h3>
            <p className="text-gray-600">
              Industry-standard authentication with NextAuth.js
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-bold mb-2">Role-Based Access</h3>
            <p className="text-gray-600">
              Admin and user roles with granular permissions
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-xl font-bold mb-2">Approval Workflow</h3>
            <p className="text-gray-600">
              Admins approve new users before granting access
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
