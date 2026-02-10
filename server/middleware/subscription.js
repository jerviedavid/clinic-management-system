import db from '../db.js';

/**
 * Middleware to require an active subscription
 * Allows trialing and active subscriptions
 * Blocks past_due and canceled subscriptions
 */
export function requireActiveSubscription(req, res, next) {
    try {
        const clinicId = req.user.clinicId;

        if (!clinicId) {
            return res.status(400).json({ message: 'No clinic context found' });
        }

        // Get subscription for this clinic
        const subscription = db.prepare(`
            SELECT s.*, p.name as planName
            FROM Subscription s
            JOIN Plan p ON s.planId = p.id
            WHERE s.clinicId = ?
        `).get(clinicId);

        if (!subscription) {
            return res.status(403).json({
                message: 'No active subscription found',
                requiresUpgrade: true
            });
        }

        // Check subscription status
        if (subscription.status === 'canceled' || subscription.status === 'past_due') {
            return res.status(403).json({
                message: 'Your subscription is not active. Please update your billing information.',
                status: subscription.status,
                requiresUpgrade: true
            });
        }

        // Check if trial has expired
        if (subscription.status === 'trialing' && subscription.trialEndsAt) {
            const trialEnd = new Date(subscription.trialEndsAt);
            const now = new Date();

            if (now > trialEnd) {
                // Trial expired - update status to past_due
                db.prepare('UPDATE Subscription SET status = ? WHERE id = ?')
                    .run('past_due', subscription.id);

                return res.status(403).json({
                    message: 'Your trial has expired. Please upgrade to continue.',
                    requiresUpgrade: true,
                    trialExpired: true
                });
            }
        }

        // Attach subscription to request for later use
        req.subscription = subscription;
        next();
    } catch (error) {
        console.error('Subscription check error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

/**
 * Middleware to require a specific plan feature
 * @param {string} feature - Feature name (e.g., 'multi_clinic', 'api_access')
 */
export function requirePlanFeature(feature) {
    return (req, res, next) => {
        try {
            const clinicId = req.user.clinicId;

            // Get plan features
            const subscription = db.prepare(`
                SELECT p.features, p.name
                FROM Subscription s
                JOIN Plan p ON s.planId = p.id
                WHERE s.clinicId = ?
            `).get(clinicId);

            if (!subscription) {
                return res.status(403).json({
                    message: 'No subscription found',
                    requiresUpgrade: true
                });
            }

            const features = subscription.features ? JSON.parse(subscription.features) : [];

            if (!features.includes(feature)) {
                return res.status(403).json({
                    message: `This feature requires a higher plan`,
                    feature: feature,
                    currentPlan: subscription.name,
                    requiresUpgrade: true
                });
            }

            next();
        } catch (error) {
            console.error('Feature check error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    };
}

/**
 * Middleware to check staff limits based on plan
 * @param {string} roleType - 'DOCTOR' or 'RECEPTIONIST'
 */
export function checkStaffLimit(roleType) {
    return (req, res, next) => {
        try {
            const clinicId = req.user.clinicId;

            // Get plan limits
            const subscription = db.prepare(`
                SELECT p.maxDoctors, p.maxStaff, p.name
                FROM Subscription s
                JOIN Plan p ON s.planId = p.id
                WHERE s.clinicId = ?
            `).get(clinicId);

            if (!subscription) {
                return res.status(403).json({
                    message: 'No subscription found',
                    requiresUpgrade: true
                });
            }

            // Count current staff
            const roleId = db.prepare('SELECT id FROM Role WHERE name = ?').get(roleType)?.id;

            if (!roleId) {
                return res.status(400).json({ message: 'Invalid role type' });
            }

            const currentCount = db.prepare(`
                SELECT COUNT(*) as count
                FROM ClinicUser
                WHERE clinicId = ? AND roleId = ?
            `).get(clinicId, roleId).count;

            // Check limits
            if (roleType === 'DOCTOR' && subscription.maxDoctors !== null) {
                if (currentCount >= subscription.maxDoctors) {
                    return res.status(403).json({
                        message: `Your ${subscription.name} plan allows up to ${subscription.maxDoctors} doctor(s). Please upgrade to add more.`,
                        currentCount: currentCount,
                        limit: subscription.maxDoctors,
                        requiresUpgrade: true
                    });
                }
            } else if (subscription.maxStaff !== null) {
                // Count total staff (all roles except ADMIN and SUPER_ADMIN)
                const totalStaff = db.prepare(`
                    SELECT COUNT(*) as count
                    FROM ClinicUser cu
                    JOIN Role r ON cu.roleId = r.id
                    WHERE cu.clinicId = ? AND r.name NOT IN ('ADMIN', 'SUPER_ADMIN')
                `).get(clinicId).count;

                if (totalStaff >= subscription.maxStaff) {
                    return res.status(403).json({
                        message: `Your ${subscription.name} plan allows up to ${subscription.maxStaff} staff member(s). Please upgrade to add more.`,
                        currentCount: totalStaff,
                        limit: subscription.maxStaff,
                        requiresUpgrade: true
                    });
                }
            }

            next();
        } catch (error) {
            console.error('Staff limit check error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    };
}

/**
 * Helper function to get subscription details
 * Can be used in routes without middleware
 */
export function getSubscriptionDetails(clinicId) {
    try {
        const subscription = db.prepare(`
            SELECT 
                s.*,
                p.name as planName,
                p.priceMonthly,
                p.priceYearly,
                p.maxDoctors,
                p.maxStaff,
                p.multiClinic,
                p.features
            FROM Subscription s
            JOIN Plan p ON s.planId = p.id
            WHERE s.clinicId = ?
        `).get(clinicId);

        if (!subscription) {
            return null;
        }

        // Calculate trial days left
        let trialDaysLeft = null;
        if (subscription.status === 'trialing' && subscription.trialEndsAt) {
            const trialEnd = new Date(subscription.trialEndsAt);
            const now = new Date();
            const diffTime = trialEnd - now;
            trialDaysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (trialDaysLeft < 0) trialDaysLeft = 0;
        }

        return {
            ...subscription,
            features: subscription.features ? JSON.parse(subscription.features) : [],
            trialDaysLeft
        };
    } catch (error) {
        console.error('Get subscription details error:', error);
        return null;
    }
}
