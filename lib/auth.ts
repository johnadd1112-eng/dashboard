import { NextAuthOptions, Session, User } from "next-auth"
import { JWT } from "next-auth/jwt"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Invalid credentials")
                }

                const user = await prisma.user.findUnique({
                    where: {
                        email: credentials.email,
                    },
                })

                if (!user) {
                    throw new Error("Invalid credentials")
                }

                const isPasswordValid = await compare(credentials.password, user.password)

                if (!isPasswordValid) {
                    throw new Error("Invalid credentials")
                }

                // Check if user is approved
                if (user.status !== "APPROVED") {
                    throw new Error("Your account is pending approval")
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    status: user.status,
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }: { token: JWT; user?: User }) {
            if (user) {
                token.id = user.id
                token.role = user.role
                token.status = user.status
            }
            return token
        },
        async session({ session, token }: { session: Session; token: JWT }) {
            if (session.user) {
                session.user.id = (token.id as string) || (token.sub as string)
                session.user.role = token.role as string
                session.user.status = token.status as string
            }
            return session
        },
    },
}
