import express from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { getSubscriptionDetails } from '../middleware/subscription.js';

const router = express.Router();

/**
 * GET /api/billing/subscription
 * Get current subscription details for the user's clinic
 */
router.get('/subscription', requireAuth, async (req, res) => {
    try {
        const clinicId = req.user.clinicId;

        const subscriptionDetails = getSubscriptionDetails(clinicId);

        if (!subscriptionDetails) {
            return res.status(404).json({
                message: 'No subscription found for this clinic'
            });
        }

        // Get current staff counts
        const doctorCount = db.prepare(`
            SELECT COUNT(*) as count
            FROM ClinicUser cu
            JOIN Role r ON cu.roleId = r.id
            WHERE cu.clinicId = ? AND r.name = 'DOCTOR'
        `).get(clinicId).count;

        const totalStaff = db.prepare(`
            SELECT COUNT(*) as count
            FROM ClinicUser cu
            JOIN Role r ON cu.roleId = r.id
            WHERE cu.clinicId = ? AND r.name NOT IN ('ADMIN', 'SUPER_ADMIN')
        `).get(clinicId).count;

        res.json({
            subscription: {
                id: subscriptionDetails.id,
                status: subscriptionDetails.status,
                planName: subscriptionDetails.planName,
                priceMonthly: subscriptionDetails.priceMonthly,
                priceYearly: subscriptionDetails.priceYearly,
                trialEndsAt: subscriptionDetails.trialEndsAt,
                trialDaysLeft: subscriptionDetails.trialDaysLeft,
                startsAt: subscriptionDetails.startsAt,
                endsAt: subscriptionDetails.endsAt
            },
            plan: {
                name: subscriptionDetails.planName,
                maxDoctors: subscriptionDetails.maxDoctors,
                maxStaff: subscriptionDetails.maxStaff,
                multiClinic: subscriptionDetails.multiClinic === 1,
                features: subscriptionDetails.features
            },
            usage: {
                doctors: doctorCount,
                totalStaff: totalStaff,
                maxDoctors: subscriptionDetails.maxDoctors,
                maxStaff: subscriptionDetails.maxStaff
            }
        });
    } catch (error) {
        console.error('Get subscription error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * GET /api/billing/plans
 * Get all available plans
 */
router.get('/plans', async (req, res) => {
    try {
        const plans = db.prepare(`
            SELECT id, name, priceMonthly, priceYearly, maxDoctors, maxStaff, multiClinic, features
            FROM Plan
            ORDER BY priceMonthly ASC
        `).all();

        const formattedPlans = plans.map(plan => ({
            ...plan,
            multiClinic: plan.multiClinic === 1,
            features: plan.features ? JSON.parse(plan.features) : []
        }));

        res.json({ plans: formattedPlans });
    } catch (error) {
        console.error('Get plans error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * POST /api/billing/upgrade
 * Upgrade to a higher plan
 */
router.post('/upgrade', requireAuth, async (req, res) => {
    try {
        const clinicId = req.user.clinicId;
        const { planName, billingCycle } = req.body;

        if (!planName || !billingCycle) {
            return res.status(400).json({
                message: 'Plan name and billing cycle are required'
            });
        }

        if (!['monthly', 'yearly'].includes(billingCycle)) {
            return res.status(400).json({
                message: 'Billing cycle must be monthly or yearly'
            });
        }

        // Get the new plan
        const newPlan = db.prepare('SELECT * FROM Plan WHERE name = ?').get(planName);

        if (!newPlan) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        // Get current subscription
        const currentSubscription = db.prepare('SELECT * FROM Subscription WHERE clinicId = ?').get(clinicId);

        if (!currentSubscription) {
            return res.status(404).json({ message: 'No subscription found' });
        }

        // Validate upgrade (can't downgrade via this endpoint)
        const currentPlan = db.prepare('SELECT * FROM Plan WHERE id = ?').get(currentSubscription.planId);

        if (newPlan.priceMonthly <= currentPlan.priceMonthly) {
            return res.status(400).json({
                message: 'Use the downgrade endpoint to switch to a lower plan'
            });
        }

        // Mock payment processing - in production, integrate with Stripe/LemonSqueezy here
        console.log(`[MOCK PAYMENT] Processing upgrade for clinic ${clinicId} to ${planName} (${billingCycle})`);

        // Update subscription
        db.prepare(`
            UPDATE Subscription
            SET planId = ?, status = 'active', trialEndsAt = NULL, updatedAt = CURRENT_TIMESTAMP
            WHERE clinicId = ?
        `).run(newPlan.id, clinicId);

        // Get updated subscription
        const updatedSubscription = getSubscriptionDetails(clinicId);

        res.json({
            message: 'Subscription upgraded successfully',
            subscription: updatedSubscription
        });
    } catch (error) {
        console.error('Upgrade subscription error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * POST /api/billing/downgrade
 * Downgrade to a lower plan
 */
router.post('/downgrade', requireAuth, async (req, res) => {
    try {
        const clinicId = req.user.clinicId;
        const { planName } = req.body;

        if (!planName) {
            return res.status(400).json({ message: 'Plan name is required' });
        }

        // Get the new plan
        const newPlan = db.prepare('SELECT * FROM Plan WHERE name = ?').get(planName);

        if (!newPlan) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        // Get current subscription
        const currentSubscription = db.prepare('SELECT * FROM Subscription WHERE clinicId = ?').get(clinicId);

        if (!currentSubscription) {
            return res.status(404).json({ message: 'No subscription found' });
        }

        // Validate it's actually a downgrade
        const currentPlan = db.prepare('SELECT * FROM Plan WHERE id = ?').get(currentSubscription.planId);

        if (newPlan.priceMonthly >= currentPlan.priceMonthly) {
            return res.status(400).json({
                message: 'Use the upgrade endpoint to switch to a higher plan'
            });
        }

        // Check if current usage exceeds new plan limits
        const doctorCount = db.prepare(`
            SELECT COUNT(*) as count
            FROM ClinicUser cu
            JOIN Role r ON cu.roleId = r.id
            WHERE cu.clinicId = ? AND r.name = 'DOCTOR'
        `).get(clinicId).count;

        const totalStaff = db.prepare(`
            SELECT COUNT(*) as count
            FROM ClinicUser cu
            JOIN Role r ON cu.roleId = r.id
            WHERE cu.clinicId = ? AND r.name NOT IN ('ADMIN', 'SUPER_ADMIN')
        `).get(clinicId).count;

        if (newPlan.maxDoctors !== null && doctorCount > newPlan.maxDoctors) {
            return res.status(400).json({
                message: `Cannot downgrade: You have ${doctorCount} doctor(s) but the ${planName} plan allows only ${newPlan.maxDoctors}`,
                currentDoctors: doctorCount,
                planLimit: newPlan.maxDoctors
            });
        }

        if (newPlan.maxStaff !== null && totalStaff > newPlan.maxStaff) {
            return res.status(400).json({
                message: `Cannot downgrade: You have ${totalStaff} staff member(s) but the ${planName} plan allows only ${newPlan.maxStaff}`,
                currentStaff: totalStaff,
                planLimit: newPlan.maxStaff
            });
        }

        // Update subscription
        db.prepare(`
            UPDATE Subscription
            SET planId = ?, updatedAt = CURRENT_TIMESTAMP
            WHERE clinicId = ?
        `).run(newPlan.id, clinicId);

        // Get updated subscription
        const updatedSubscription = getSubscriptionDetails(clinicId);

        res.json({
            message: 'Subscription downgraded successfully',
            subscription: updatedSubscription
        });
    } catch (error) {
        console.error('Downgrade subscription error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * POST /api/billing/cancel
 * Cancel subscription (sets end date, doesn't delete immediately)
 */
router.post('/cancel', requireAuth, async (req, res) => {
    try {
        const clinicId = req.user.clinicId;

        // Get current subscription
        const subscription = db.prepare('SELECT * FROM Subscription WHERE clinicId = ?').get(clinicId);

        if (!subscription) {
            return res.status(404).json({ message: 'No subscription found' });
        }

        if (subscription.status === 'canceled') {
            return res.status(400).json({ message: 'Subscription is already canceled' });
        }

        // Set end date to 30 days from now (or end of current billing period)
        const endsAt = new Date();
        endsAt.setDate(endsAt.getDate() + 30);

        // Update subscription
        db.prepare(`
            UPDATE Subscription
            SET status = 'canceled', endsAt = ?, updatedAt = CURRENT_TIMESTAMP
            WHERE clinicId = ?
        `).run(endsAt.toISOString(), clinicId);

        res.json({
            message: 'Subscription canceled successfully. Access will continue until the end of your billing period.',
            endsAt: endsAt.toISOString()
        });
    } catch (error) {
        console.error('Cancel subscription error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
