import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
    CreditCard,
    TrendingUp,
    Users,
    Building2,
    AlertCircle,
    Check,
    X,
    Zap
} from 'lucide-react';

export default function BillingSettings() {
    const navigate = useNavigate();
    const {
        subscription,
        usage,
        isTrialing,
        trialDaysLeft,
        currentPlan,
        fetchSubscription
    } = useContext(AuthContext);

    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [upgrading, setUpgrading] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    useEffect(() => {
        loadPlans();
    }, []);

    async function loadPlans() {
        try {
            const response = await api.get('/billing/plans');
            setPlans(response.data.plans);
        } catch (error) {
            console.error('Load plans error:', error);
            toast.error('Failed to load plans');
        } finally {
            setLoading(false);
        }
    }

    async function handleUpgrade(planName) {
        if (upgrading) return;

        setUpgrading(true);
        try {
            await api.post('/billing/upgrade', {
                planName,
                billingCycle: 'monthly'
            });

            toast.success(`Successfully upgraded to ${planName}!`);
            await fetchSubscription();
        } catch (error) {
            console.error('Upgrade error:', error);
            toast.error(error.response?.data?.message || 'Failed to upgrade');
        } finally {
            setUpgrading(false);
        }
    }

    async function handleCancelSubscription() {
        try {
            await api.post('/billing/cancel');
            toast.success('Subscription canceled. Access continues until end of billing period.');
            setShowCancelModal(false);
            await fetchSubscription();
        } catch (error) {
            console.error('Cancel error:', error);
            toast.error(error.response?.data?.message || 'Failed to cancel subscription');
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const currentPlanData = plans.find(p => p.name === currentPlan);

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-blue-600 hover:text-blue-700 mb-4"
                    >
                        ← Back
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
                    <p className="text-gray-600 mt-2">Manage your subscription and billing settings</p>
                </div>

                {/* Trial Banner */}
                {isTrialing && (
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 mb-8 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold mb-2">
                                    🎉 You're on a Free Trial!
                                </h2>
                                <p className="text-blue-100">
                                    {trialDaysLeft} days remaining. Upgrade anytime to continue after your trial ends.
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-4xl font-bold">{trialDaysLeft}</div>
                                <div className="text-sm text-blue-100">days left</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Current Plan Card */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <CreditCard className="w-8 h-8 text-blue-600" />
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Current Plan</h2>
                                <p className="text-gray-600">
                                    {isTrialing ? 'Free Trial' : subscription?.status}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-gray-900">
                                {currentPlan}
                            </div>
                            <div className="text-gray-600">
                                ${currentPlanData?.priceMonthly / 100}/month
                            </div>
                        </div>
                    </div>

                    {/* Usage Stats */}
                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-200">
                        <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-gray-400" />
                            <div>
                                <div className="text-sm text-gray-600">Doctors</div>
                                <div className="font-semibold text-gray-900">
                                    {usage?.doctors || 0} / {currentPlanData?.maxDoctors || '∞'}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Building2 className="w-5 h-5 text-gray-400" />
                            <div>
                                <div className="text-sm text-gray-600">Total Staff</div>
                                <div className="font-semibold text-gray-900">
                                    {usage?.totalStaff || 0} / {currentPlanData?.maxStaff || '∞'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upgrade Options */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Plans</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {plans.map((plan) => {
                            const isCurrent = plan.name === currentPlan;
                            const isHigher = plan.priceMonthly > (currentPlanData?.priceMonthly || 0);

                            return (
                                <div
                                    key={plan.name}
                                    className={`bg-white rounded-lg shadow-md p-6 ${isCurrent ? 'ring-2 ring-blue-500' : ''
                                        }`}
                                >
                                    {isCurrent && (
                                        <div className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full inline-block mb-4">
                                            CURRENT PLAN
                                        </div>
                                    )}

                                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                                        {plan.name}
                                    </h3>
                                    <div className="text-3xl font-bold text-gray-900 mb-4">
                                        ${plan.priceMonthly / 100}
                                        <span className="text-sm text-gray-600 font-normal">/month</span>
                                    </div>

                                    <ul className="space-y-2 mb-6">
                                        <li className="flex items-center gap-2 text-sm text-gray-700">
                                            <Check className="w-4 h-4 text-green-500" />
                                            {plan.maxDoctors || 'Unlimited'} Doctors
                                        </li>
                                        <li className="flex items-center gap-2 text-sm text-gray-700">
                                            <Check className="w-4 h-4 text-green-500" />
                                            {plan.maxStaff || 'Unlimited'} Staff
                                        </li>
                                        <li className="flex items-center gap-2 text-sm text-gray-700">
                                            <Check className="w-4 h-4 text-green-500" />
                                            {plan.multiClinic ? 'Multi-Clinic' : '1 Clinic'}
                                        </li>
                                        <li className="flex items-center gap-2 text-sm text-gray-700">
                                            <Zap className="w-4 h-4 text-blue-500" />
                                            Web + Mobile
                                        </li>
                                    </ul>

                                    {!isCurrent && isHigher && (
                                        <button
                                            onClick={() => handleUpgrade(plan.name)}
                                            disabled={upgrading}
                                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                                        >
                                            {upgrading ? 'Upgrading...' : 'Upgrade'}
                                        </button>
                                    )}

                                    {isCurrent && (
                                        <div className="text-center text-sm text-gray-500 py-2">
                                            Your current plan
                                        </div>
                                    )}

                                    {!isCurrent && !isHigher && (
                                        <div className="text-center text-sm text-gray-400 py-2">
                                            Lower tier
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Cancel Subscription */}
                {subscription?.status !== 'canceled' && !isTrialing && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-start gap-4">
                            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Cancel Subscription
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    You can cancel your subscription at any time. You'll retain access until the end of your current billing period.
                                </p>
                                <button
                                    onClick={() => setShowCancelModal(true)}
                                    className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition"
                                >
                                    Cancel Subscription
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Cancel Confirmation Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                            Cancel Subscription?
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to cancel your subscription? You'll retain access until the end of your billing period, but your subscription will not renew.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                            >
                                Keep Subscription
                            </button>
                            <button
                                onClick={handleCancelSubscription}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                            >
                                Yes, Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
