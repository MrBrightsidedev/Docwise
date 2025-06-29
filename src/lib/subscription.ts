import { supabase } from './supabase';

export interface UserSubscriptionData {
  customer_id: string | null;
  subscription_id: string | null;
  subscription_status: string | null;
  price_id: string | null;
  current_period_start: number | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean | null;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
}

export interface UserUsageData {
  ai_generations_used: number;
  plan: 'free' | 'pro' | 'business';
  created_at: string;
  updated_at: string;
}

export interface PlanLimits {
  aiGenerations: number;
  documents: number;
  features: string[];
}

/**
 * Get plan limits based on subscription tier
 */
export function getPlanLimits(plan: string): PlanLimits {
  switch (plan) {
    case 'free':
      return {
        aiGenerations: 1,
        documents: 3,
        features: ['Basic templates', 'PDF export', 'Email support']
      };
    case 'pro':
      return {
        aiGenerations: 10,
        documents: 50,
        features: ['All templates', 'PDF & Google export', 'Priority support', 'Team collaboration']
      };
    case 'business':
      return {
        aiGenerations: -1, // Unlimited
        documents: -1, // Unlimited
        features: ['Everything in Pro', 'Custom templates', 'API access', 'Dedicated support', 'Advanced analytics']
      };
    default:
      return {
        aiGenerations: 1,
        documents: 3,
        features: ['Basic templates', 'PDF export', 'Email support']
      };
  }
}

/**
 * Fetch current user subscription status
 */
export async function getUserSubscriptionStatus(): Promise<UserSubscriptionData | null> {
  try {
    const { data, error } = await supabase
      .from('stripe_user_subscriptions')
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('Error fetching subscription status:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserSubscriptionStatus:', error);
    return null;
  }
}

/**
 * Fetch current user usage data
 */
export async function getUserUsageData(): Promise<UserUsageData | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('user_usage')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      // Create initial usage record if it doesn't exist
      const { data: newUsage, error: insertError } = await supabase
        .from('user_usage')
        .insert([{ 
          user_id: user.id, 
          ai_generations_used: 0, 
          plan: 'free' 
        }])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      return newUsage;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserUsageData:', error);
    return null;
  }
}

/**
 * Update user plan based on subscription status
 */
export async function syncUserPlanWithSubscription(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get subscription status
    const subscription = await getUserSubscriptionStatus();
    
    // Determine plan based on subscription
    let newPlan: 'free' | 'pro' | 'business' = 'free';
    
    if (subscription?.subscription_status === 'active' && subscription.price_id) {
      // Map price IDs to plans (you'll need to update these with your actual Stripe price IDs)
      const priceIdToPlan: Record<string, 'pro' | 'business'> = {
        'price_1RfLWW2cKms2tazUxzjrznUQ': 'pro', // Test subscription pro
        'price_1RfLXW2cKms2tazUSxzTlOW1': 'business', // Enterprise test subscription
      };
      
      newPlan = priceIdToPlan[subscription.price_id] || 'free';
    }

    // Update user usage with new plan
    const { error } = await supabase
      .from('user_usage')
      .upsert({
        user_id: user.id,
        plan: newPlan,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error updating user plan:', error);
      return false;
    }

    console.log(`User plan updated to: ${newPlan}`);
    return true;
  } catch (error) {
    console.error('Error in syncUserPlanWithSubscription:', error);
    return false;
  }
}

/**
 * Check if user has reached their usage limits
 */
export async function checkUsageLimits(): Promise<{
  canUseAI: boolean;
  canCreateDocument: boolean;
  aiUsage: { used: number; limit: number };
  documentUsage: { used: number; limit: number };
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get usage data
    const usage = await getUserUsageData();
    if (!usage) {
      throw new Error('Could not fetch usage data');
    }

    // Get document count
    const { count: documentCount, error: countError } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      throw countError;
    }

    const limits = getPlanLimits(usage.plan);
    
    return {
      canUseAI: limits.aiGenerations === -1 || usage.ai_generations_used < limits.aiGenerations,
      canCreateDocument: limits.documents === -1 || (documentCount || 0) < limits.documents,
      aiUsage: {
        used: usage.ai_generations_used,
        limit: limits.aiGenerations
      },
      documentUsage: {
        used: documentCount || 0,
        limit: limits.documents
      }
    };
  } catch (error) {
    console.error('Error checking usage limits:', error);
    return {
      canUseAI: false,
      canCreateDocument: false,
      aiUsage: { used: 0, limit: 1 },
      documentUsage: { used: 0, limit: 3 }
    };
  }
}

/**
 * Force refresh subscription and usage data
 */
export async function refreshSubscriptionData(): Promise<{
  subscription: UserSubscriptionData | null;
  usage: UserUsageData | null;
  synced: boolean;
}> {
  try {
    // First sync the plan with subscription
    const synced = await syncUserPlanWithSubscription();
    
    // Then fetch fresh data
    const [subscription, usage] = await Promise.all([
      getUserSubscriptionStatus(),
      getUserUsageData()
    ]);

    return {
      subscription,
      usage,
      synced
    };
  } catch (error) {
    console.error('Error refreshing subscription data:', error);
    return {
      subscription: null,
      usage: null,
      synced: false
    };
  }
}