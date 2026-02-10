async function testDatabaseConnection() {
    console.log('🔍 Testing database connection...\n');

    let prisma;

    try {
        // Dynamically import Prisma Client
        const { PrismaClient } = await import('@prisma/client');

        prisma = new PrismaClient({
            log: ['query', 'info', 'warn', 'error'],
        });

        // Test 1: Basic connection
        console.log('Test 1: Checking database connection...');
        await prisma.$connect();
        console.log('✅ Database connected successfully!\n');

        // Test 2: Query users table
        console.log('Test 2: Querying users table...');
        const userCount = await prisma.user.count();
        console.log(`✅ Found ${userCount} users in the database\n`);

        // Test 3: Query clinics table
        console.log('Test 3: Querying clinics table...');
        const clinicCount = await prisma.clinic.count();
        console.log(`✅ Found ${clinicCount} clinics in the database\n`);

        // Test 4: Query roles table
        console.log('Test 4: Querying roles table...');
        const roles = await prisma.role.findMany();
        console.log(`✅ Found ${roles.length} roles:`);
        roles.forEach(role => console.log(`   - ${role.name} (ID: ${role.id})`));
        console.log('');

        // Test 5: Get sample user with clinic relationships
        console.log('Test 5: Checking user-clinic relationships...');
        const sampleUser = await prisma.user.findFirst({
            include: {
                clinics: {
                    include: {
                        clinic: true,
                        role: true
                    }
                }
            }
        });

        if (sampleUser) {
            console.log(`✅ Sample user found: ${sampleUser.email}`);
            console.log(`   Full Name: ${sampleUser.fullName}`);
            console.log(`   Clinics: ${sampleUser.clinics.length}`);
            sampleUser.clinics.forEach(cu => {
                console.log(`   - ${cu.clinic.name} (Role: ${cu.role.name})`);
            });
        } else {
            console.log('⚠️  No users found in database');
        }
        console.log('');

        // Test 6: Check database file location
        console.log('Test 6: Database configuration...');
        console.log(`✅ Database URL: ${process.env.DATABASE_URL || 'file:./dev.db'}`);
        console.log('');

        console.log('🎉 All database tests passed successfully!');

    } catch (error) {
        console.error('❌ Database connection test failed:');
        console.error('Error:', error.message);
        console.error('\nFull error details:', error);

        if (error.code === 'P1001') {
            console.error('\n💡 Suggestion: Database server is not reachable. Check if the database file exists.');
        } else if (error.code === 'P2021') {
            console.error('\n💡 Suggestion: Table does not exist. Run migrations: npx prisma migrate dev');
        }

        process.exit(1);
    } finally {
        if (prisma) {
            await prisma.$disconnect();
            console.log('\n🔌 Database connection closed.');
        }
    }
}

testDatabaseConnection();
