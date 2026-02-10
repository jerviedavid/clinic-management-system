import db from './db.js';

// Test query to check staff data
const clinics = db.prepare(`
    SELECT c.*, 
    (SELECT json_group_array(json_object(
        'id', u.id, 
        'fullName', u.fullName, 
        'email', u.email, 
        'role', (SELECT GROUP_CONCAT(r2.name, ', ')
                FROM ClinicUser cu2
                JOIN Role r2 ON cu2.roleId = r2.id
                WHERE cu2.userId = u.id AND cu2.clinicId = c.id)
    ))
     FROM ClinicUser cu 
     JOIN User u ON cu.userId = u.id 
     WHERE cu.clinicId = c.id
     GROUP BY u.id) as staff
    FROM Clinic c
`).all();

console.log('Clinics with staff:');
clinics.forEach(clinic => {
    console.log(`\n${clinic.name} (ID: ${clinic.id})`);
    const staff = clinic.staff ? JSON.parse(clinic.staff) : [];
    console.log(`  Staff count: ${staff.length}`);
    staff.forEach(s => {
        console.log(`  - ${s.fullName} (${s.email}) - ${s.role}`);
    });
});
