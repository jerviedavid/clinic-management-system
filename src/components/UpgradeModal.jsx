import { X, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function UpgradeModal({ isOpen, onClose, feature, requiredPlan, currentPlan }) {
    const navigate = useNavigate();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-2xl font-bold text-center text-gray-900 mb-2">
                    Upgrade Required
                </h3>

                <p className="text-center text-gray-600 mb-6">
                    {feature ? (
                        <>
                            <span className="font-semibold">{feature}</span> requires the{' '}
                            <span className="font-semibold text-blue-600">{requiredPlan}</span> plan.
                        </>
                    ) : (
                        <>
                            This feature requires a higher plan.
                        </>
                    )}
                </p>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Current Plan:</span>
                        <span className="font-semibold text-gray-900">{currentPlan}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Required Plan:</span>
                        <span className="font-semibold text-blue-600">{requiredPlan}</span>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    >
                        Maybe Later
                    </button>
                    <button
                        onClick={() => {
                            navigate('/settings/billing');
                            onClose();
                        }}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition"
                    >
                        Upgrade Now
                    </button>
                </div>

                <button
                    onClick={() => {
                        navigate('/pricing');
                        onClose();
                    }}
                    className="w-full mt-3 text-sm text-blue-600 hover:text-blue-700"
                >
                    View All Plans →
                </button>
            </div>
        </div>
    );
}
