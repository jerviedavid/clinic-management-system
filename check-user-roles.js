import Database from 'better-sqlite3';

const db = new Database('./prisma/dev.db');

const email = 'danilwilliam401@gmail.com';

// Get user
const user = db.prepare('SELECT * FROM User WHERE email = ?').get(email);
console.log('User:', user);

if (user) {
    // Get roles
    const roles = db.prepare(`
    SELECT r.name as roleName, cu.clinicId 
    FROM ClinicUser cu 
    JOIN Role r ON cu.roleId = r.id 
    WHERE cu.userId = ?
  `).all(user.id);

    console.log('\nRoles:');
    roles.forEach(role => {
        console.log(`  - ${role.roleName} (Clinic ID: ${role.clinicId})`);
    });

    // Check if SUPER_ADMIN exists
    const hasSuperAdmin = roles.some(r => r.roleName === 'SUPER_ADMIN');
    console.log(`\nHas SUPER_ADMIN role: ${hasSuperAdmin}`);
}

db.close();
