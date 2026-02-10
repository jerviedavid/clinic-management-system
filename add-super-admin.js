import Database from 'better-sqlite3';

const db = new Database('./prisma/dev.db');

const email = 'danilwilliam401@gmail.com';

// Get user
const user = db.prepare('SELECT id, email FROM User WHERE email = ?').get(email);

if (!user) {
    console.log('User not found!');
    process.exit(1);
}

console.log(`User ID: ${user.id}, Email: ${user.email}`);

// Check if SUPER_ADMIN role exists
const superAdminRole = db.prepare("SELECT * FROM Role WHERE name = 'SUPER_ADMIN'").get();

if (!superAdminRole) {
    console.log('\nSUPER_ADMIN role does not exist. Creating it...');
    const result = db.prepare("INSERT INTO Role (name) VALUES ('SUPER_ADMIN')").run();
    console.log('SUPER_ADMIN role created with ID:', result.lastInsertRowid);
    superAdminRole = { id: result.lastInsertRowid, name: 'SUPER_ADMIN' };
} else {
    console.log(`\nSUPER_ADMIN role exists with ID: ${superAdminRole.id}`);
}

// Check if user already has SUPER_ADMIN
const existingRole = db.prepare(`
  SELECT * FROM ClinicUser 
  WHERE userId = ? AND roleId = ? AND clinicId = 0
`).get(user.id, superAdminRole.id);

if (existingRole) {
    console.log('User already has SUPER_ADMIN role!');
} else {
    console.log('Adding SUPER_ADMIN role to user...');
    db.prepare(`
    INSERT INTO ClinicUser (userId, clinicId, roleId)
    VALUES (?, 0, ?)
  `).run(user.id, superAdminRole.id);
    console.log('✅ SUPER_ADMIN role added successfully!');
}

// Show all roles for this user
const allRoles = db.prepare(`
  SELECT r.name as roleName, cu.clinicId 
  FROM ClinicUser cu 
  JOIN Role r ON cu.roleId = r.id 
  WHERE cu.userId = ?
`).all(user.id);

console.log('\nAll roles for this user:');
allRoles.forEach(role => {
    console.log(`  - ${role.roleName} (Clinic ID: ${role.clinicId})`);
});

db.close();
