import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET() {
    const prisma = new PrismaClient();

    try {
        await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "documents" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "size" INTEGER NOT NULL DEFAULT 0,
        "mimeType" TEXT NOT NULL DEFAULT 'text/plain',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "documents_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

        // Verify
        const tables = await prisma.$queryRawUnsafe(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'documents';
    `);

        return NextResponse.json({
            success: true,
            message: 'Documents table created successfully!',
            tables
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
