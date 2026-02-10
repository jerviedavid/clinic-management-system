import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { AlertTriangle, Lock, CreditCard } from 'lucide-react';

export default function SubscriptionBanner() {
    const { subscription, isTrialing, trialDaysLeft } = useContext(AuthContext);

    // Don't show if no subscription data
    if (!subscription) return null;

    const status = subscription.status;

    // Trial expiring soon (3 days or less)
    if (isTrialing && trialDaysLeft <= 3 && trialDaysLeft > 0) {
        return (
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-3 shadow-lg">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5" />
                        <div>
                            <p className="font-semibold">
                                Your trial expires in {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''}!
                            </p>
                            <p className="text-sm text-white/90">
                                Upgrade now to continue accessing all features.
                            </p>
                        </div>
                    </div>
                    <Link
                        to="/settings/billing"
                        className="px-4 py-2 bg-white text-orange-600 rounded-lg font-semibold hover:bg-white/90 transition flex items-center gap-2"
                    >
                        <CreditCard className="w-4 h-4" />
                        Upgrade Now
                    </Link>
                </div>
            </div>
        );
    }

    // Trial expired or subscription past_due/canceled
    if (status === 'past_due' || status === 'canceled') {
        return (
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-3 shadow-lg">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5" />
                        <div>
                            <p className="font-semibold">
                                {status === 'past_due' ? 'Your trial has expired' : 'Subscription canceled'}
                            </p>
                            <p className="text-sm text-white/90">
                                You're in read-only mode. Upgrade to regain full access.
                            </p>
                        </div>
                    </div>
                    <Link
                        to="/settings/billing"
                        className="px-4 py-2 bg-white text-red-600 rounded-lg font-semibold hover:bg-white/90 transition flex items-center gap-2"
                    >
                        <CreditCard className="w-4 h-4" />
                        Reactivate
                    </Link>
                </div>
            </div>
        );
    }

    return null;
}
