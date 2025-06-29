import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import DocEditor from '../components/DocEditor';

const Editor: React.FC = () => {
  const { docId } = useParams<{ docId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
          // Document not found
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
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Document not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <DocEditor
        documentId={document.id}
        initialTitle={document.title}
        initialContent={document.content}
        onSave={handleSave}
      />
    </div>
  );
};

export default Editor;