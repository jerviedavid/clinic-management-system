import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { FaCircleCheck, FaCircleExclamation, FaArrowsRotate, FaEnvelope } from 'react-icons/fa6'

export default function EmailVerificationStatus() {
  const { currentUser, resendVerificationEmail, refreshUser } = useAuth()
  const [isChecking, setIsChecking] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState('')

  const handleRefreshStatus = async () => {
    if (!currentUser) return
    
    setIsChecking(true)
    setError('')
    try {
      // Refresh user data from the backend
      await refreshUser()
      
      // Check if email is now verified
      if (currentUser.emailVerified) {
        // Reload page to show updated status
        window.location.reload()
      }
    } catch (error) {
      console.error('Error refreshing verification status:', error)
      setError('Failed to check status')
    } finally {
      setIsChecking(false)
    }
  }

  const handleResendEmail = async () => {
    if (!currentUser) return
    
    setIsSending(true)
    setEmailSent(false)
    setError('')
    try {
      await resendVerificationEmail()
      setEmailSent(true)
      // Hide success message after 5 seconds
      setTimeout(() => setEmailSent(false), 5000)
    } catch (error) {
      console.error('Error resending verification email:', error)
      setError('Failed to send email. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  if (!currentUser) return null

  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-2">
        {currentUser.emailVerified ? (
          <FaCircleCheck className="w-4 h-4 text-green-400" />
        ) : (
          <FaCircleExclamation className="w-4 h-4 text-red-400" />
        )}
        <span className={`font-medium ${currentUser.emailVerified ? 'text-green-400' : 'text-red-400'}`}>
          {currentUser.emailVerified ? 'Verified' : 'Not Verified'}
        </span>
      </div>
      
      {!currentUser.emailVerified && (
        <div className="flex space-x-2">
          <button 
            onClick={handleRefreshStatus}
            disabled={isChecking}
            className="text-xs bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 px-3 py-1 rounded transition-colors flex items-center space-x-1"
          >
            {isChecking ? (
              <FaArrowsRotate className="w-3 h-3 animate-spin" />
            ) : (
              <FaArrowsRotate className="w-3 h-3" />
            )}
            <span>{isChecking ? 'Checking...' : 'Check Again'}</span>
          </button>
          
          <button 
            onClick={handleResendEmail}
            disabled={isSending}
            className="text-xs bg-green-500 hover:bg-green-600 disabled:bg-green-300 px-3 py-1 rounded transition-colors flex items-center space-x-1"
          >
            {isSending ? (
              <FaArrowsRotate className="w-3 h-3 animate-spin" />
            ) : (
              <FaEnvelope className="w-3 h-3" />
            )}
            <span>{isSending ? 'Sending...' : 'Resend Email'}</span>
          </button>
        </div>
      )}
      
      {emailSent && (
        <div className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded">
          ✓ Verification email sent! Check your inbox.
        </div>
      )}
      
      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded">
          {error}
        </div>
      )}
    </div>
  )
}
