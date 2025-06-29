import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, FileText, Loader2 } from 'lucide-react';
import { refreshSubscriptionData } from '../lib/subscription';

const Success: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'pending' | 'success' | 'error'>('pending');

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      try {
        setLoading(true);
        
        // Wait a moment for Stripe webhook to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Refresh subscription data to sync with payment
        const result = await refreshSubscriptionData();
        
        if (result.synced && result.usage) {
          setSyncStatus('success');
          console.log('Subscription successfully synced:', result.usage.plan);
        } else {
          setSyncStatus('error');
          console.warn('Subscription sync may have failed');
        }
      } catch (error) {
        console.error('Error handling payment success:', error);
        setSyncStatus('error');
      } finally {
        setLoading(false);
      }
    };

    handlePaymentSuccess();
  }, []);

  const handleGoToDashboard = () => {
    // Force a page refresh to ensure all components reload with new subscription data
    window.location.href = '/dashboard';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md">
            <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing your payment...</h2>
            <p className="text-gray-600">We're updating your account with your new subscription.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600">
              Thank you for your purchase. Your subscription has been activated.
            </p>
          </div>

          {/* Sync Status */}
          <div className="mb-6">
            {syncStatus === 'success' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800 font-medium">
                  ✅ Your account has been updated with your new subscription!
                </p>
              </div>
            )}
            
            {syncStatus === 'error' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ Your payment was successful, but it may take a few minutes for your account to update. 
                  Please refresh the page or contact support if issues persist.
                </p>
              </div>
            )}
          </div>

          {sessionId && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Session ID</p>
              <p className="text-xs font-mono text-gray-800 break-all">{sessionId}</p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleGoToDashboard}
              className="w-full bg-primary-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
            >
              <FileText className="h-4 w-4" />
              <span>Go to Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            
            <Link
              to="/account"
              className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-50 transition-colors block"
            >
              View Account Settings
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">What's Next?</h3>
            <ul className="text-sm text-gray-600 space-y-2 text-left">
              <li className="flex items-start space-x-2">
                <span className="text-primary-600 font-bold">•</span>
                <span>Access all premium features in your dashboard</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-primary-600 font-bold">•</span>
                <span>Generate unlimited AI-powered documents</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-primary-600 font-bold">•</span>
                <span>Export to PDF and Google Docs</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Success;