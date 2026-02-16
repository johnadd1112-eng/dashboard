const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function approveAll() {
    console.log('Upgrading all users to ADMIN and APPROVED status...');
    try {
        const result = await prisma.user.updateMany({
            data: {
                role: 'ADMIN',
                status: 'APPROVED'
            }
        });
        console.log(`Success! Updated ${result.count} users.`);
    } catch (error) {
        console.error('Error upgrading users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

approveAll();
