import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, FileText, TrendingUp, Crown, Upload, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useSubscription } from '../hooks/useSubscription';
import DocCard from '../components/DocCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';

interface Document {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const { subscription, usage, limits, usageCheck, loading: subscriptionLoading, refresh: refreshSubscription } = useSubscription();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      showToast('error', 'Failed to load documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createNewDocument = async () => {
    // Check if user can create more documents
    if (!usageCheck.canCreateDocument) {
      showToast('warning', `Document limit reached (${usageCheck.documentUsage.used}/${usageCheck.documentUsage.limit}). Please upgrade your plan.`);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('documents')
        .insert([
          {
            user_id: user?.id,
            title: 'Untitled Document',
            content: '',
          },
        ])
        .select()
        .single();

      if (error) throw error;
      showToast('success', 'New document created successfully!');
      navigate(`/editor/${data.id}`);
    } catch (error) {
      console.error('Error creating document:', error);
      showToast('error', 'Failed to create document. Please try again.');
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      // Optimistic update - remove from UI immediately
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)
        .eq('user_id', user?.id);

      if (error) {
        // Revert optimistic update on error
        await fetchDocuments();
        throw error;
      }

      showToast('success', 'Document deleted successfully!');
    } catch (error) {
      console.error('Error deleting document:', error);
      showToast('error', 'Failed to delete document. Please try again.');
    }
  };

  const handleRefreshSubscription = async () => {
    setRefreshing(true);
    try {
      await refreshSubscription();
      showToast('success', 'Subscription data refreshed!');
    } catch (error) {
      showToast('error', 'Failed to refresh subscription data.');
    } finally {
      setRefreshing(false);
    }
  };

  const getSubscriptionBadge = () => {
    if (!usage) return null;
    
    const planColors = {
      free: 'bg-gray-100 text-gray-800',
      pro: 'bg-blue-100 text-blue-800',
      business: 'bg-purple-100 text-purple-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${planColors[usage.plan]}`}>
        {usage.plan.charAt(0).toUpperCase() + usage.plan.slice(1)}
      </span>
    );
  };

  if (loading || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="bg-gray-200 h-8 rounded w-1/3 mb-2 animate-pulse"></div>
            <div className="bg-gray-200 h-5 rounded w-1/2 animate-pulse"></div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 animate-pulse">
                <div className="bg-gray-200 h-6 rounded w-3/4 mb-2"></div>
                <div className="bg-gray-200 h-8 rounded w-1/2"></div>
              </div>
            ))}
          </div>

          <LoadingSkeleton count={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.email?.split('@')[0]}!
              </h1>
              <p className="text-gray-600">
                Manage your legal documents and generate new ones with AI assistance.
              </p>
            </div>
            <button
              onClick={handleRefreshSubscription}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 text-sm border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
              title="Refresh subscription data"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold text-gray-900">
                  {documents.length}
                  {usageCheck.documentUsage.limit > 0 && (
                    <span className="text-sm text-gray-500">/{usageCheck.documentUsage.limit}</span>
                  )}
                </p>
              </div>
              <FileText className="h-8 w-8 text-primary-600" />
            </div>
            {usageCheck.documentUsage.limit > 0 && (
              <div className="mt-3">
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min((usageCheck.documentUsage.used / usageCheck.documentUsage.limit) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">AI Generations Used</p>
                <p className="text-2xl font-bold text-gray-900">
                  {usageCheck.aiUsage.used}
                  {usageCheck.aiUsage.limit > 0 && (
                    <span className="text-sm text-gray-500">/{usageCheck.aiUsage.limit}</span>
                  )}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            {usageCheck.aiUsage.limit > 0 && (
              <div className="mt-3">
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min((usageCheck.aiUsage.used / usageCheck.aiUsage.limit) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Plan</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold text-gray-900 capitalize">
                    {usage?.plan || 'Free'}
                  </p>
                  {getSubscriptionBadge()}
                </div>
              </div>
              <Crown className="h-8 w-8 text-yellow-600" />
            </div>
            {usage?.plan === 'free' && (
              <Link
                to="/pricing"
                className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                Upgrade Plan →
              </Link>
            )}
          </div>
        </div>

        {/* Subscription Status Banner */}
        {subscription?.subscription_status === 'active' && usage?.plan !== 'free' && (
          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 mb-8 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">🎉 Premium Active!</h3>
                <p className="opacity-90">
                  You're on the {usage.plan.charAt(0).toUpperCase() + usage.plan.slice(1)} plan with full access to all features.
                </p>
              </div>
              <Link
                to="/account"
                className="bg-white text-green-600 px-6 py-2 rounded-xl font-semibold hover:bg-gray-100 transition-colors shadow-md"
              >
                Manage Subscription
              </Link>
            </div>
          </div>
        )}

        {/* Upgrade Banner for Free Users */}
        {usage?.plan === 'free' && (
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 mb-8 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Unlock More Features</h3>
                <p className="opacity-90">
                  Upgrade to Pro for unlimited AI generations and advanced features.
                </p>
              </div>
              <Link
                to="/pricing"
                className="bg-white text-primary-600 px-6 py-2 rounded-xl font-semibold hover:bg-gray-100 transition-colors shadow-md"
              >
                Upgrade Now
              </Link>
            </div>
          </div>
        )}

        {/* Usage Limit Warnings */}
        {!usageCheck.canUseAI && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6">
            <p className="text-yellow-800">
              ⚠️ You've reached your AI generation limit ({usageCheck.aiUsage.used}/{usageCheck.aiUsage.limit}). 
              <Link to="/pricing" className="font-medium underline ml-1">Upgrade your plan</Link> to continue generating documents.
            </p>
          </div>
        )}

        {!usageCheck.canCreateDocument && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6">
            <p className="text-yellow-800">
              ⚠️ You've reached your document limit ({usageCheck.documentUsage.used}/{usageCheck.documentUsage.limit}). 
              <Link to="/pricing" className="font-medium underline ml-1">Upgrade your plan</Link> to create more documents.
            </p>
          </div>
        )}

        {/* Documents Section */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Your Documents</h2>
          <button
            onClick={createNewDocument}
            disabled={!usageCheck.canCreateDocument}
            className="flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
            title={!usageCheck.canCreateDocument ? 'Document limit reached' : 'Create new document'}
          >
            <Plus className="h-5 w-5" />
            <span>New Document</span>
          </button>
        </div>

        {documents.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
            <div className="max-w-md mx-auto">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No documents yet</h3>
              <p className="text-gray-600 mb-6">
                Upload or connect a Google Doc to get started, or create your first legal document with AI assistance.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={createNewDocument}
                  disabled={!usageCheck.canCreateDocument}
                  className="flex items-center justify-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add Document</span>
                </button>
                <button className="flex items-center justify-center space-x-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <Upload className="h-5 w-5" />
                  <span>Upload File</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <DocCard
                key={doc.id}
                id={doc.id}
                title={doc.title}
                createdAt={doc.created_at}
                content={doc.content}
                onDelete={handleDeleteDocument}
              />
            ))}
          </div>
        )}
      </div>

      <Toast
        type={toast.type}
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
};

export default Dashboard;