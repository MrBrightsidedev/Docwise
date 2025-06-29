import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, FileText, TrendingUp, Crown, Upload, RefreshCw, Sparkles, Search, Filter } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useSubscription } from '../hooks/useSubscription';
import DocCard from '../components/DocCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import UsageProgressBar from '../components/UsageProgressBar';
import BulkActions from '../components/BulkActions';
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
  const [searchParams] = useSearchParams();
  const { toast, showToast, hideToast } = useToast();
  const { subscription, usage, limits, usageCheck, loading: subscriptionLoading, refresh: refreshSubscription } = useSubscription();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [highlightedDocId, setHighlightedDocId] = useState<string | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  useEffect(() => {
    const highlightId = searchParams.get('highlight');
    if (highlightId) {
      setHighlightedDocId(highlightId);
      showToast('success', '🎉 Your AI-generated document has been created and is ready for review!');
      
      setTimeout(() => {
        setHighlightedDocId(null);
      }, 5000);
    }
  }, [searchParams, showToast]);

  useEffect(() => {
    filterDocuments();
  }, [documents, searchQuery, filterType]);

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

  const filterDocuments = () => {
    let filtered = documents;

    if (searchQuery) {
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(doc => {
        const title = doc.title.toLowerCase();
        switch (filterType) {
          case 'nda':
            return title.includes('nda') || title.includes('non-disclosure');
          case 'privacy':
            return title.includes('privacy');
          case 'terms':
            return title.includes('terms');
          case 'partnership':
            return title.includes('partnership');
          default:
            return true;
        }
      });
    }

    setFilteredDocuments(filtered);
  };

  const createNewDocument = async () => {
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
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      setSelectedDocuments(prev => prev.filter(id => id !== documentId));
      
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)
        .eq('user_id', user?.id);

      if (error) {
        await fetchDocuments();
        throw error;
      }

      showToast('success', 'Document deleted successfully!');
    } catch (error) {
      console.error('Error deleting document:', error);
      showToast('error', 'Failed to delete document. Please try again.');
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .in('id', ids)
        .eq('user_id', user?.id);

      if (error) throw error;

      setDocuments(prev => prev.filter(doc => !ids.includes(doc.id)));
      setSelectedDocuments([]);
      showToast('success', `${ids.length} document(s) deleted successfully!`);
    } catch (error) {
      console.error('Error deleting documents:', error);
      showToast('error', 'Failed to delete documents. Please try again.');
    }
  };

  const handleBulkDownload = async (ids: string[]) => {
    try {
      const docsToDownload = documents.filter(doc => ids.includes(doc.id));
      
      for (const doc of docsToDownload) {
        const blob = new Blob([doc.content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${doc.title}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      
      showToast('success', `${ids.length} document(s) downloaded successfully!`);
    } catch (error) {
      console.error('Error downloading documents:', error);
      showToast('error', 'Failed to download documents. Please try again.');
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
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center space-x-2 shadow-md">
                <Sparkles className="h-4 w-4" />
                <span>Enhanced AI v2.0</span>
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
        </div>

        {/* Enhanced AI Promotion Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-2xl p-6 mb-8 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <Sparkles className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">🚀 Enhanced Legal AI v2.0 is Live!</h3>
                <p className="opacity-90 mb-2">
                  New features: Voice input, file upload, document actions, and advanced workflow management.
                </p>
                <div className="flex items-center space-x-4 text-sm opacity-80">
                  <span>• Voice-to-text input</span>
                  <span>• Document upload & review</span>
                  <span>• Advanced chat actions</span>
                  <span>• Multi-format export</span>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="bg-white bg-opacity-20 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold">💬</div>
                <div className="text-sm opacity-90">Try it now!</div>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Progress Bars */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <UsageProgressBar
              used={usageCheck.aiUsage.used}
              limit={usageCheck.aiUsage.limit}
              label="AI Generations"
              type={usageCheck.aiUsage.used / usageCheck.aiUsage.limit >= 0.9 ? 'warning' : 'default'}
              showUpgrade={true}
              onUpgrade={() => navigate('/pricing')}
            />
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <UsageProgressBar
              used={usageCheck.documentUsage.used}
              limit={usageCheck.documentUsage.limit}
              label="Documents Created"
              type={usageCheck.documentUsage.used / usageCheck.documentUsage.limit >= 0.9 ? 'warning' : 'default'}
              showUpgrade={true}
              onUpgrade={() => navigate('/pricing')}
            />
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

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Documents</option>
              <option value="nda">NDAs</option>
              <option value="privacy">Privacy Policies</option>
              <option value="terms">Terms of Service</option>
              <option value="partnership">Partnerships</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {documents.length > 0 && (
          <div className="mb-6">
            <BulkActions
              selectedItems={selectedDocuments}
              totalItems={filteredDocuments.length}
              onSelectAll={() => setSelectedDocuments(filteredDocuments.map(doc => doc.id))}
              onDeselectAll={() => setSelectedDocuments([])}
              onDelete={handleBulkDelete}
              onDownload={handleBulkDownload}
            />
          </div>
        )}

        {/* Documents Section */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Your Documents {filteredDocuments.length !== documents.length && (
              <span className="text-lg text-gray-500">({filteredDocuments.length} of {documents.length})</span>
            )}
          </h2>
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

        {filteredDocuments.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
            <div className="max-w-md mx-auto">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {documents.length === 0 ? 'No documents yet' : 'No documents match your search'}
              </h3>
              <p className="text-gray-600 mb-6">
                {documents.length === 0 
                  ? 'Use the Enhanced AI chat assistant to generate your first legal document, or create one manually.'
                  : 'Try adjusting your search terms or filters to find what you\'re looking for.'
                }
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
              {documents.length === 0 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Tip:</strong> Click the chat button (💬) in the bottom-right corner to generate documents with Enhanced AI v2.0!
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className={`transition-all duration-300 ${
                  highlightedDocId === doc.id 
                    ? 'ring-4 ring-green-400 ring-opacity-50 scale-105' 
                    : ''
                }`}
              >
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={selectedDocuments.includes(doc.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDocuments(prev => [...prev, doc.id]);
                      } else {
                        setSelectedDocuments(prev => prev.filter(id => id !== doc.id));
                      }
                    }}
                    className="absolute top-4 left-4 z-10 rounded"
                  />
                  <DocCard
                    id={doc.id}
                    title={doc.title}
                    createdAt={doc.created_at}
                    content={doc.content}
                    onDelete={handleDeleteDocument}
                  />
                </div>
              </div>
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