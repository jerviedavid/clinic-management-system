import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'dev.db'));

console.log('🔄 Running subscription system migration...\n');

try {
    // Create Plan table
    console.log('Creating Plan table...');
    db.exec(`
    CREATE TABLE IF NOT EXISTS Plan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      priceMonthly INTEGER NOT NULL,
      priceYearly INTEGER NOT NULL,
      maxDoctors INTEGER,
      maxStaff INTEGER,
      multiClinic INTEGER NOT NULL DEFAULT 0,
      features TEXT,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
    console.log('✅ Plan table created');

    // Create Subscription table
    console.log('Creating Subscription table...');
    db.exec(`
    CREATE TABLE IF NOT EXISTS Subscription (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clinicId INTEGER NOT NULL UNIQUE,
      planId INTEGER NOT NULL,
      status TEXT NOT NULL,
      trialEndsAt TEXT,
      startsAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      endsAt TEXT,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clinicId) REFERENCES Clinic(id) ON DELETE CASCADE,
      FOREIGN KEY (planId) REFERENCES Plan(id)
    )
  `);
    console.log('✅ Subscription table created');

    // Create indexes
    console.log('Creating indexes...');
    db.exec(`
    CREATE INDEX IF NOT EXISTS idx_subscription_clinicId ON Subscription(clinicId);
    CREATE INDEX IF NOT EXISTS idx_subscription_status ON Subscription(status);
  `);
    console.log('✅ Indexes created');

    // Seed plans
    console.log('\n🌱 Seeding subscription plans...');

    const plans = [
        {
            name: 'STARTER',
            priceMonthly: 2900,
            priceYearly: 29000,
            maxDoctors: 1,
            maxStaff: 2,
            multiClinic: 0,
            features: JSON.stringify([
                'appointments',
                'prescriptions',
                'basic_billing',
                'patient_records'
            ])
        },
        {
            name: 'GROWTH',
            priceMonthly: 5900,
            priceYearly: 59000,
            maxDoctors: 5,
            maxStaff: 15,
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
            priceMonthly: 12900,
            priceYearly: 129000,
            maxDoctors: null,
            maxStaff: null,
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
        console.log(`✅ Created plan: ${plan.name} ($${plan.priceMonthly / 100}/mo)`);
    });

    // Give existing clinics trial subscriptions
    console.log('\n🎁 Creating trial subscriptions for existing clinics...');

    const existingClinics = db.prepare('SELECT id, name FROM Clinic').all();
    const starterPlan = db.prepare('SELECT id FROM Plan WHERE name = ?').get('STARTER');

    if (starterPlan && existingClinics.length > 0) {
        const insertSubscription = db.prepare(`
      INSERT OR IGNORE INTO Subscription (clinicId, planId, status, trialEndsAt)
      VALUES (?, ?, ?, ?)
    `);

        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 14);

        existingClinics.forEach(clinic => {
            insertSubscription.run(
                clinic.id,
                starterPlan.id,
                'trialing',
                trialEndsAt.toISOString()
            );
            console.log(`✅ Trial subscription created for: ${clinic.name}`);
        });

        console.log(`\n📊 Total: ${existingClinics.length} clinic(s) with 14-day trial`);
    } else {
        console.log('ℹ️  No existing clinics found');
    }

    console.log('\n✨ Migration complete!\n');

} catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
} finally {
    db.close();
}
