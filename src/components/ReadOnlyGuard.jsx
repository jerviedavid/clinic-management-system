import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';

/**
 * Wrapper component that disables children when subscription is expired
 * Shows a tooltip and prevents actions in read-only mode
 */
export default function ReadOnlyGuard({ children, showMessage = true }) {
    const { subscription } = useContext(AuthContext);

    const isReadOnly = subscription?.status === 'past_due' || subscription?.status === 'canceled';

    if (!isReadOnly) {
        return children;
    }

    const handleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (showMessage) {
            toast.error('This action is disabled in read-only mode. Please upgrade your subscription.');
        }
    };

    return (
        <div
            className="relative cursor-not-allowed opacity-60"
            onClick={handleClick}
            title="Disabled in read-only mode"
        >
            <div className="pointer-events-none">
                {children}
            </div>
            {showMessage && (
                <div className="absolute top-0 right-0 -mt-1 -mr-1">
                    <Lock className="w-4 h-4 text-red-500" />
                </div>
            )}
        </div>
    );
}

/**
 * Hook to check if in read-only mode
 */
export function useReadOnly() {
    const { subscription } = useContext(AuthContext);
    const isReadOnly = subscription?.status === 'past_due' || subscription?.status === 'canceled';

    return {
        isReadOnly,
        checkReadOnly: () => {
            if (isReadOnly) {
                toast.error('This action is disabled in read-only mode. Please upgrade your subscription.');
                return true;
            }
            return false;
        }
    };
}
