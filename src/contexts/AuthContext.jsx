import { createContext, useEffect, useState } from 'react'
import api from '../utils/api'

const AuthContext = createContext()

export { AuthContext }
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [availableClinics, setAvailableClinics] = useState([])
  const [selectedClinic, setSelectedClinic] = useState(null)
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)

  // Subscription state
  const [subscription, setSubscription] = useState(null)
  const [planFeatures, setPlanFeatures] = useState([])
  const [usage, setUsage] = useState(null)

  // Helper flags
  const primaryRole = roles ? (roles.find(r => r !== 'ADMIN' && r !== 'SUPER_ADMIN') || roles[0]) : null
  const userRole = primaryRole ? primaryRole.toLowerCase() : null
  const isAdmin = roles && roles.includes('ADMIN')
  const isDoctor = roles && roles.includes('DOCTOR')
  const isReceptionist = roles && roles.includes('RECEPTIONIST')
  const isSuperAdmin = roles && roles.includes('SUPER_ADMIN')

  // Subscription helpers
  const isTrialing = subscription?.status === 'trialing'
  const isActive = subscription?.status === 'active'
  const trialDaysLeft = subscription?.trialDaysLeft || 0
  const currentPlan = subscription?.planName || 'STARTER'

  const hasFeature = (feature) => {
    return planFeatures.includes(feature)
  }

  const canAddDoctor = () => {
    if (!usage || !subscription) return true
    const maxDoctors = subscription.plan?.maxDoctors
    if (maxDoctors === null) return true // unlimited
    return usage.doctors < maxDoctors
  }

  const canAddStaff = () => {
    if (!usage || !subscription) return true
    const maxStaff = subscription.plan?.maxStaff
    if (maxStaff === null) return true // unlimited
    return usage.totalStaff < maxStaff
  }

  async function refreshUser() {
    try {
      const response = await api.get('/auth/me');
      console.log('[DEBUG] refreshUser response:', response.data);
      setCurrentUser(response.data.user);
      setAvailableClinics(response.data.clinics);
      if (response.data.currentClinic) {
        setRoles(response.data.currentClinic.roles);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  }

  async function fetchSubscription() {
    try {
      const response = await api.get('/billing/subscription');
      // Merge plan data into subscription for easier access
      setSubscription({
        ...response.data.subscription,
        plan: response.data.plan
      });
      setPlanFeatures(response.data.plan?.features || []);
      setUsage(response.data.usage);
    } catch (error) {
      console.error('Fetch subscription error:', error);
      // Don't fail if subscription fetch fails
      setSubscription(null);
      setPlanFeatures([]);
      setUsage(null);
    }
  }

  async function signup(email, password, fullName) {
    // No longer requires role parameter
    const response = await api.post('/auth/signup', { email, password, fullName });
    setCurrentUser(response.data.user);
    setSelectedClinic({
      clinicId: response.data.clinic.id,
      clinicName: response.data.clinic.name,
      roles: response.data.roles
    });
    setRoles(response.data.roles);
    setAvailableClinics([{
      clinicId: response.data.clinic.id,
      clinicName: response.data.clinic.name,
      roles: response.data.roles
    }]);

    // Fetch subscription data
    await fetchSubscription();

    return response.data;
  }

  async function googleSignup(googleCredential) {
    const response = await api.post('/auth/google-signup', { credential: googleCredential });
    setCurrentUser(response.data.user);
    setSelectedClinic({
      clinicId: response.data.clinic.id,
      clinicName: response.data.clinic.name,
      roles: response.data.roles
    });
    setRoles(response.data.roles);
    setAvailableClinics([{
      clinicId: response.data.clinic.id,
      clinicName: response.data.clinic.name,
      roles: response.data.roles
    }]);

    // Fetch subscription data
    await fetchSubscription();

    return response.data;
  }

  async function login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    setCurrentUser(response.data.user);
    setAvailableClinics(response.data.clinics || []);
    setSelectedClinic(response.data.selectedClinic || null);
    setRoles(response.data.selectedClinic?.roles || []);

    // Fetch subscription data
    await fetchSubscription();

    return response.data;
  }

  async function logout() {
    await api.post('/auth/logout');
    setCurrentUser(null);
    setAvailableClinics([]);
    setSelectedClinic(null);
    setRoles([]);
  }

  async function switchClinic(clinicId) {
    const response = await api.post('/clinics/switch', { clinicId });
    setSelectedClinic({
      clinicId: response.data.clinic.id,
      clinicName: response.data.clinic.name,
      roles: response.data.roles
    });
    setRoles(response.data.roles);

    // Fetch subscription for new clinic
    await fetchSubscription();

    return response.data;
  }

  async function resetPassword(email) {
    // Placeholder for reset password API
    console.log('Reset password req for:', email);
  }

  async function resendVerificationEmail() {
    if (!currentUser?.email) {
      throw new Error('No user email found');
    }
    try {
      await api.post('/auth/resend-verification', { email: currentUser.email });
      return true;
    } catch (error) {
      console.error('Resend verification error:', error);
      throw error;
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get('/auth/me');
        setCurrentUser(response.data.user);
        setAvailableClinics(response.data.clinics);

        // Set current clinic from JWT
        if (response.data.currentClinic) {
          const currentClinicData = response.data.clinics.find(
            c => c.clinicId === response.data.currentClinic.clinicId
          );
          setSelectedClinic(currentClinicData || response.data.currentClinic);
          setRoles(response.data.currentClinic.roles);

          // Fetch subscription data
          await fetchSubscription();
        }
      } catch (error) {
        // Not logged in or error, try health check for debug
        api.get('/health').then(h => console.log('Server Health Context:', h.data)).catch(() => { });
        setCurrentUser(null);
        setAvailableClinics([]);
        setSelectedClinic(null);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [])

  const value = {
    currentUser,
    availableClinics,
    selectedClinic,
    roles,
    signup,
    googleSignup,
    login,
    logout,
    switchClinic,
    resetPassword,
    resendVerificationEmail,
    refreshUser,
    fetchSubscription,
    loading,
    userRole,
    isAdmin,
    isDoctor,
    isReceptionist,
    isSuperAdmin,
    // Subscription data
    subscription,
    planFeatures,
    usage,
    isTrialing,
    isActive,
    trialDaysLeft,
    currentPlan,
    hasFeature,
    canAddDoctor,
    canAddStaff
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
