import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'clinic.db'));

console.log('🌱 Seeding subscription plans...');

// Define the 3 pricing plans
const plans = [
    {
        name: 'STARTER',
        priceMonthly: 2900,  // $29.00
        priceYearly: 29000,  // $290.00 (2 months free)
        maxDoctors: 1,
        maxStaff: 2,  // 1 doctor + 1 receptionist
        multiClinic: 0,  // SQLite uses 0/1 for boolean
        features: JSON.stringify([
            'appointments',
            'prescriptions',
            'basic_billing',
            'patient_records'
        ])
    },
    {
        name: 'GROWTH',
        priceMonthly: 5900,  // $59.00
        priceYearly: 59000,  // $590.00
        maxDoctors: 5,
        maxStaff: 15,  // 5 doctors + 10 staff
        multiClinic: 0,
        features: JSON.stringify([
            'appointments',
            'prescriptions',
            'billing',
            'inventory',
            'patient_records',
            'reports',
            'advanced_scheduling'
        ])
    },
    {
        name: 'PRO',
        priceMonthly: 12900,  // $129.00
        priceYearly: 129000,  // $1290.00
        maxDoctors: null,  // unlimited
        maxStaff: null,     // unlimited
        multiClinic: 1,
        features: JSON.stringify([
            'appointments',
            'prescriptions',
            'billing',
            'inventory',
            'patient_records',
            'reports',
            'advanced_scheduling',
            'multi_clinic',
            'audit_logs',
            'api_access',
            'priority_support'
        ])
    }
];

// Insert plans (skip if already exists)
const insertPlan = db.prepare(`
  INSERT OR IGNORE INTO Plan (name, priceMonthly, priceYearly, maxDoctors, maxStaff, multiClinic, features)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

plans.forEach(plan => {
    insertPlan.run(
        plan.name,
        plan.priceMonthly,
        plan.priceYearly,
        plan.maxDoctors,
        plan.maxStaff,
        plan.multiClinic,
        plan.features
    );
    console.log(`✅ Created plan: ${plan.name}`);
});

// Give existing clinics a trial subscription (grandfather existing users)
console.log('\n🎁 Creating trial subscriptions for existing clinics...');

const existingClinics = db.prepare('SELECT id FROM Clinic').all();
const starterPlan = db.prepare('SELECT id FROM Plan WHERE name = ?').get('STARTER');

if (starterPlan && existingClinics.length > 0) {
    const insertSubscription = db.prepare(`
    INSERT OR IGNORE INTO Subscription (clinicId, planId, status, trialEndsAt)
    VALUES (?, ?, ?, ?)
  `);

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14 days from now

    existingClinics.forEach(clinic => {
        insertSubscription.run(
            clinic.id,
            starterPlan.id,
            'trialing',
            trialEndsAt.toISOString()
        );
    });

    console.log(`✅ Created ${existingClinics.length} trial subscription(s)`);
}

console.log('\n✨ Seeding complete!');

db.close();
