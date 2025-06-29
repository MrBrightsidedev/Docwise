import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import DocEditor from '../components/DocEditor';
import BackButton from '../components/BackButton';
import Breadcrumbs from '../components/Breadcrumbs';
import ProgressIndicator from '../components/ProgressIndicator';
import LoadingSpinner from '../components/LoadingSpinner';

const Editor: React.FC = () => {
  const { docId } = useParams<{ docId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const steps = [
    { id: 'create', name: 'Create Document', status: 'complete' as const },
    { id: 'edit', name: 'Edit & Review', status: 'current' as const },
    { id: 'finalize', name: 'Finalize & Export', status: 'upcoming' as const },
  ];

  const breadcrumbItems = [
    { label: 'Documents', href: '/dashboard' },
    { label: document?.title || 'Loading...', current: true },
  ];

  useEffect(() => {
    if (docId && user) {
      fetchDocument();
    }
  }, [docId, user]);

  const fetchDocument = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', docId)
        .eq('user_id', user?.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          navigate('/dashboard');
          return;
        }
        throw error;
      }

      setDocument(data);
    } catch (error) {
      console.error('Error fetching document:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (title: string, content: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({
          title,
          content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', docId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setDocument((prev: any) => ({ ...prev, title, content }));
    } catch (error) {
      console.error('Error saving document:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading document..." />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Document not found</p>
          <BackButton to="/dashboard" label="Back to Dashboard" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Navigation */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <BackButton to="/dashboard" label="Back to Dashboard" />
            <div className="text-sm text-gray-500">
              Last saved: {new Date(document.updated_at).toLocaleString()}
            </div>
          </div>
          
          <Breadcrumbs items={breadcrumbItems} className="mb-4" />
          
          <ProgressIndicator steps={steps} />
        </div>
      </div>

      {/* Editor Content */}
      <div className="py-8">
        <DocEditor
          documentId={document.id}
          initialTitle={document.title}
          initialContent={document.content}
          onSave={handleSave}
        />
      </div>
    </div>
  );
};

export default Editor;