import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'prisma', 'dev.db');

console.log('🔍 Database & Login Test Report\n');
console.log('='.repeat(60));
console.log(`📁 Database: ${dbPath}`);
console.log('='.repeat(60) + '\n');

try {
    const db = new Database(dbPath);
    db.pragma('journal_mode = WAL');

    console.log('✅ DATABASE CONNECTION: SUCCESS\n');

    // Get all users with their passwords
    const users = db.prepare(`
    SELECT id, email, fullName, password, createdAt, lastLogin 
    FROM User
  `).all();

    console.log(`📊 TOTAL USERS: ${users.length}\n`);

    if (users.length === 0) {
        console.log('⚠️  WARNING: No users found in database!');
        console.log('   You need to create a user account first.\n');
    } else {
        console.log('👥 USER ACCOUNTS:\n');

        for (const user of users) {
            console.log(`   Email: ${user.email}`);
            console.log(`   Name: ${user.fullName}`);
            console.log(`   User ID: ${user.id}`);
            console.log(`   Created: ${user.createdAt}`);
            console.log(`   Last Login: ${user.lastLogin || 'Never'}`);

            // Check if password is hashed
            const isHashed = user.password.startsWith('$2a$') || user.password.startsWith('$2b$');
            console.log(`   Password Status: ${isHashed ? '✅ Hashed (bcrypt)' : '⚠️  Plain text or invalid'}`);

            // Get user's clinic assignments
            const clinicAssignments = db.prepare(`
        SELECT 
          c.name as clinicName,
          r.name as roleName,
          cu.createdAt
        FROM ClinicUser cu
        JOIN Clinic c ON cu.clinicId = c.id
        JOIN Role r ON cu.roleId = r.id
        WHERE cu.userId = ?
      `).all(user.id);

            if (clinicAssignments.length > 0) {
                console.log(`   Clinic Access:`);
                clinicAssignments.forEach(ca => {
                    console.log(`      - ${ca.clinicName} (${ca.roleName})`);
                });
            } else {
                console.log(`   Clinic Access: ⚠️  None assigned`);
            }

            console.log('');
        }
    }

    // Check clinics
    const clinics = db.prepare('SELECT id, name, email, phone FROM Clinic').all();
    console.log(`🏥 TOTAL CLINICS: ${clinics.length}\n`);

    if (clinics.length > 0) {
        clinics.forEach(clinic => {
            console.log(`   - ${clinic.name}`);
            if (clinic.email) console.log(`     Email: ${clinic.email}`);
            if (clinic.phone) console.log(`     Phone: ${clinic.phone}`);

            const staffCount = db.prepare('SELECT COUNT(*) as count FROM ClinicUser WHERE clinicId = ?').get(clinic.id);
            console.log(`     Staff: ${staffCount.count} members`);
            console.log('');
        });
    }

    // Check roles
    const roles = db.prepare('SELECT id, name FROM Role').all();
    console.log(`👔 AVAILABLE ROLES: ${roles.length}\n`);
    roles.forEach(role => {
        const userCount = db.prepare('SELECT COUNT(*) as count FROM ClinicUser WHERE roleId = ?').get(role.id);
        console.log(`   - ${role.name} (${userCount.count} users)`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('🎉 DATABASE TEST COMPLETE');
    console.log('='.repeat(60) + '\n');

    // Backend server check
    console.log('🔧 BACKEND SERVER STATUS:\n');
    console.log('   Expected URL: http://localhost:5000');
    console.log('   Health Check: http://localhost:5000/api/health');
    console.log('   Login Endpoint: http://localhost:5000/api/auth/login\n');

    console.log('💡 TROUBLESHOOTING TIPS:\n');
    console.log('   1. Make sure backend server is running: npm run server');
    console.log('   2. Check if you can access: http://localhost:5000/api/health');
    console.log('   3. Verify your email and password are correct');
    console.log('   4. Check browser console for error messages');
    console.log('   5. Clear browser cache and cookies if needed\n');

    db.close();

} catch (error) {
    console.error('❌ TEST FAILED:');
    console.error('Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
}
