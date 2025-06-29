import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getUserSubscriptionStatus, 
  getUserUsageData, 
  refreshSubscriptionData,
  checkUsageLimits,
  UserSubscriptionData,
  UserUsageData,
  PlanLimits,
  getPlanLimits
} from '../lib/subscription';

interface UseSubscriptionReturn {
  subscription: UserSubscriptionData | null;
  usage: UserUsageData | null;
  limits: PlanLimits;
  usageCheck: {
    canUseAI: boolean;
    canCreateDocument: boolean;
    aiUsage: { used: number; limit: number };
    documentUsage: { used: number; limit: number };
  };
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useSubscription = (): UseSubscriptionReturn => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscriptionData | null>(null);
  const [usage, setUsage] = useState<UserUsageData | null>(null);
  const [usageCheck, setUsageCheck] = useState({
    canUseAI: false,
    canCreateDocument: false,
    aiUsage: { used: 0, limit: 1 },
    documentUsage: { used: 0, limit: 3 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Refresh all subscription and usage data
      const result = await refreshSubscriptionData();
      
      if (result.subscription !== null) {
        setSubscription(result.subscription);
      }
      
      if (result.usage !== null) {
        setUsage(result.usage);
      }

      // Check current usage limits
      const limits = await checkUsageLimits();
      setUsageCheck(limits);

      if (!result.synced) {
        console.warn('Subscription sync may have failed');
      }
    } catch (err) {
      console.error('Error refreshing subscription data:', err);
      setError('Failed to load subscription information');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial load and refresh when user changes
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-refresh every 30 seconds when component is active
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      refresh();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user, refresh]);

  const limits = usage ? getPlanLimits(usage.plan) : getPlanLimits('free');

  return {
    subscription,
    usage,
    limits,
    usageCheck,
    loading,
    error,
    refresh
  };
};