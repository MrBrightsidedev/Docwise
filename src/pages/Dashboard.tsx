import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, FileText, TrendingUp, Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import DocCard from '../components/DocCard';

interface Document {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

interface UserUsage {
  ai_generations_used: number;
  plan: 'free' | 'pro' | 'business';
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [userUsage, setUserUsage] = useState<UserUsage>({ ai_generations_used: 0, plan: 'free' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDocuments();
      fetchUserUsage();
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
    }
  };

  const fetchUserUsage = async () => {
    try {
      const { data, error } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setUserUsage(data);
      } else {
        // Create initial usage record
        const { data: newUsage, error: insertError } = await supabase
          .from('user_usage')
          .insert([{ user_id: user?.id, ai_generations_used: 0, plan: 'free' }])
          .select()
          .single();

        if (insertError) throw insertError;
        setUserUsage(newUsage);
      }
    } catch (error) {
      console.error('Error fetching user usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewDocument = async () => {
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
      navigate(`/editor/${data.id}`);
    } catch (error) {
      console.error('Error creating document:', error);
    }
  };

  const getPlanLimits = (plan: string) => {
    switch (plan) {
      case 'free':
        return { aiGenerations: 1, documents: 3 };
      case 'pro':
        return { aiGenerations: 10, documents: 50 };
      case 'business':
        return { aiGenerations: -1, documents: -1 }; // Unlimited
      default:
        return { aiGenerations: 1, documents: 3 };
    }
  };

  const limits = getPlanLimits(userUsage.plan);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.email?.split('@')[0]}!
          </h1>
          <p className="text-gray-600">
            Manage your legal documents and generate new ones with AI assistance.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
              </div>
              <FileText className="h-8 w-8 text-primary-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">AI Generations Used</p>
                <p className="text-2xl font-bold text-gray-900">
                  {userUsage.ai_generations_used}
                  {limits.aiGenerations > 0 && (
                    <span className="text-sm text-gray-500">/{limits.aiGenerations}</span>
                  )}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            {limits.aiGenerations > 0 && (
              <div className="mt-3">
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min((userUsage.ai_generations_used / limits.aiGenerations) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Plan</p>
                <p className="text-2xl font-bold text-gray-900 capitalize">{userUsage.plan}</p>
              </div>
              <Crown className="h-8 w-8 text-yellow-600" />
            </div>
            {userUsage.plan === 'free' && (
              <Link
                to="/pricing"
                className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Upgrade Plan →
              </Link>
            )}
          </div>
        </div>

        {/* Upgrade Banner for Free Users */}
        {userUsage.plan === 'free' && (
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Unlock More Features</h3>
                <p className="opacity-90">
                  Upgrade to Pro for unlimited AI generations and advanced features.
                </p>
              </div>
              <Link
                to="/pricing"
                className="bg-white text-primary-600 px-6 py-2 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
              >
                Upgrade Now
              </Link>
            </div>
          </div>
        )}

        {/* Documents Section */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Your Documents</h2>
          <button
            onClick={createNewDocument}
            className="flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>New Document</span>
          </button>
        </div>

        {documents.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first legal document with AI assistance.
            </p>
            <button
              onClick={createNewDocument}
              className="bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors"
            >
              Create Your First Document
            </button>
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;