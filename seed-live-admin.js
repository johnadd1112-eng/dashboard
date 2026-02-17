
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Using the provided Neon database URL
const DATABASE_URL = "postgresql://neondb_owner:npg_JZ0HyQCfNEs9@ep-broad-bonus-aizobcw7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: DATABASE_URL,
        },
    },
});

async function main() {
    const email = "admin@dashboard.com";
    const password = "adminPassword123!";
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.user.upsert({
        where: { email },
        update: {
            role: "ADMIN",
            status: "APPROVED",
        },
        create: {
            email,
            password: hashedPassword,
            name: "Super Admin",
            role: "ADMIN",
            status: "APPROVED",
        },
    });

    console.log('--- ADMIN CREATED ---');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('---------------------');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
