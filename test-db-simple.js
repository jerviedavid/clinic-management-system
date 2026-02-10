import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'prisma', 'dev.db');

console.log('🔍 Testing database connection...\n');
console.log(`📁 Database path: ${dbPath}\n`);

try {
    // Connect to database
    const db = new Database(dbPath);
    db.pragma('journal_mode = WAL');

    console.log('✅ Database connected successfully!\n');

    // Test 1: Check tables
    console.log('Test 1: Checking database tables...');
    const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' 
    ORDER BY name
  `).all();

    console.log(`✅ Found ${tables.length} tables:`);
    tables.forEach(table => console.log(`   - ${table.name}`));
    console.log('');

    // Test 2: Count users
    console.log('Test 2: Querying User table...');
    const userCount = db.prepare('SELECT COUNT(*) as count FROM User').get();
    console.log(`✅ Found ${userCount.count} users\n`);

    // Test 3: List all users
    if (userCount.count > 0) {
        console.log('Test 3: Listing all users...');
        const users = db.prepare('SELECT id, email, fullName, createdAt FROM User').all();
        users.forEach(user => {
            console.log(`   - ${user.email} (${user.fullName}) - ID: ${user.id}`);
        });
        console.log('');
    }

    // Test 4: Count clinics
    console.log('Test 4: Querying Clinic table...');
    const clinicCount = db.prepare('SELECT COUNT(*) as count FROM Clinic').get();
    console.log(`✅ Found ${clinicCount.count} clinics\n`);

    // Test 5: List clinics
    if (clinicCount.count > 0) {
        console.log('Test 5: Listing all clinics...');
        const clinics = db.prepare('SELECT id, name, email, phone FROM Clinic').all();
        clinics.forEach(clinic => {
            console.log(`   - ${clinic.name} (${clinic.email || 'No email'}) - ID: ${clinic.id}`);
        });
        console.log('');
    }

    // Test 6: Check roles
    console.log('Test 6: Querying Role table...');
    const roles = db.prepare('SELECT id, name FROM Role').all();
    console.log(`✅ Found ${roles.length} roles:`);
    roles.forEach(role => {
        console.log(`   - ${role.name} (ID: ${role.id})`);
    });
    console.log('');

    // Test 7: Check user-clinic relationships
    console.log('Test 7: Checking user-clinic relationships...');
    const clinicUsers = db.prepare(`
    SELECT 
      cu.id,
      u.email,
      u.fullName,
      c.name as clinicName,
      r.name as roleName
    FROM ClinicUser cu
    JOIN User u ON cu.userId = u.id
    JOIN Clinic c ON cu.clinicId = c.id
    JOIN Role r ON cu.roleId = r.id
  `).all();

    console.log(`✅ Found ${clinicUsers.length} user-clinic assignments:`);
    clinicUsers.forEach(cu => {
        console.log(`   - ${cu.email} → ${cu.clinicName} (${cu.roleName})`);
    });
    console.log('');

    console.log('🎉 All database tests passed successfully!');
    console.log('\n💡 The database is working correctly.');
    console.log('💡 If you cannot login, the backend server might not be running.');
    console.log('💡 Start the backend with: npm run server\n');

    db.close();
    console.log('🔌 Database connection closed.');

} catch (error) {
    console.error('❌ Database test failed:');
    console.error('Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
}
