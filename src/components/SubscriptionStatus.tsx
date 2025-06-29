import React, { useState, useEffect } from 'react';
import { Crown, Calendar, CreditCard, AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { getProductByPriceId } from '../stripe-config';

const SubscriptionStatus: React.FC = () => {
  const { subscription, usage, limits, loading, error, refresh } = useSubscription();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'trialing':
        return 'text-blue-600 bg-blue-100';
      case 'past_due':
        return 'text-yellow-600 bg-yellow-100';
      case 'canceled':
      case 'unpaid':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const product = subscription?.price_id ? getProductByPriceId(subscription.price_id) : null;
  const currentPlan = usage?.plan || 'free';

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Crown className="h-6 w-6 text-yellow-600" />
          <h3 className="text-lg font-semibold text-gray-900">Subscription Status</h3>
        </div>
        <div className="flex items-center space-x-2">
          {subscription?.subscription_status && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(subscription.subscription_status)}`}>
              {subscription.subscription_status.replace('_', ' ').toUpperCase()}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh subscription data"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Current Plan */}
        <div>
          <p className="text-sm font-medium text-gray-600">Current Plan</p>
          <div className="flex items-center space-x-2">
            <p className="text-lg font-semibold text-gray-900 capitalize">
              {currentPlan}
            </p>
            {subscription?.subscription_status === 'active' && (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </div>
          {product?.description && (
            <p className="text-sm text-gray-600">{product.description}</p>
          )}
        </div>

        {/* Plan Features */}
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">Plan Features</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">AI Generations:</span>
              <span className="ml-1 font-medium">
                {limits.aiGenerations === -1 ? 'Unlimited' : limits.aiGenerations}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Documents:</span>
              <span className="ml-1 font-medium">
                {limits.documents === -1 ? 'Unlimited' : limits.documents}
              </span>
            </div>
          </div>
        </div>

        {/* Subscription Details */}
        {subscription?.subscription_id ? (
          <div className="space-y-3">
            {subscription.current_period_end && (
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {subscription.cancel_at_period_end ? 'Expires' : 'Renews'} on {formatDate(subscription.current_period_end)}
                </span>
              </div>
            )}

            {subscription.payment_method_brand && subscription.payment_method_last4 && (
              <div className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {subscription.payment_method_brand.toUpperCase()} ending in {subscription.payment_method_last4}
                </span>
              </div>
            )}

            {subscription.cancel_at_period_end && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  Your subscription will not renew and will end on {formatDate(subscription.current_period_end)}.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-2">No active subscription</p>
            <p className="text-sm text-gray-500">Upgrade to access premium features</p>
          </div>
        )}

        {/* Usage Summary */}
        {usage && (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Current Usage</p>
            <div className="text-xs text-gray-600 space-y-1">
              <div>AI Generations: {usage.ai_generations_used} used</div>
              <div>Last updated: {new Date(usage.updated_at).toLocaleDateString()}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionStatus;