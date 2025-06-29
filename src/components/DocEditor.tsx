import React, { useState, useEffect } from 'react';
import { Save, Download, Wand2, FileText, ExternalLink } from 'lucide-react';
import AIModal from './AIModal';
import { exportToGoogle, getGoogleTokenStatus } from '../lib/google-integration';

interface DocEditorProps {
  documentId: string;
  initialTitle?: string;
  initialContent?: string;
  onSave: (title: string, content: string) => void;
}

const DocEditor: React.FC<DocEditorProps> = ({
  documentId,
  initialTitle = '',
  initialContent = '',
  onSave,
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    setTitle(initialTitle);
    setContent(initialContent);
  }, [initialTitle, initialContent]);

  useEffect(() => {
    checkGoogleConnection();
  }, []);

  const checkGoogleConnection = async () => {
    try {
      const status = await getGoogleTokenStatus();
      setGoogleConnected(status.connected);
    } catch (error) {
      console.error('Error checking Google connection:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(title, content);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAIGenerate = (generatedContent: string) => {
    setContent(generatedContent);
  };

  const handleExportToPDF = () => {
    // TODO: Implement PDF export functionality
    alert('PDF export coming soon!');
    setShowExportMenu(false);
  };

  const handleExportToGoogle = async (exportType: 'docs' | 'sheets') => {
    if (!googleConnected) {
      alert('Please connect your Google account in Account Settings first.');
      return;
    }

    setIsExporting(true);
    setShowExportMenu(false);

    try {
      const result = await exportToGoogle(documentId, title, content, exportType);
      
      if (result.success) {
        alert(`Document exported to Google ${exportType === 'docs' ? 'Docs' : 'Sheets'} successfully!`);
        if (result.google_url) {
          window.open(result.google_url, '_blank');
        }
      } else if (result.requires_auth) {
        alert('Google authentication required. Please reconnect your Google account in Account Settings.');
      } else {
        alert(result.message || 'Export failed. Please try again.');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document Title"
              className="text-2xl font-bold text-gray-900 bg-transparent border-none outline-none flex-1 mr-4"
            />
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsAIModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
              >
                <Wand2 className="h-4 w-4" />
                <span>Generate with AI</span>
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={isExporting}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                <span>{isExporting ? 'Exporting...' : 'Export'}</span>
              </button>
              
              {showExportMenu && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-10">
                  <button
                    onClick={handleExportToPDF}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Export as PDF</span>
                  </button>
                  <button
                    onClick={() => handleExportToGoogle('docs')}
                    disabled={!googleConnected}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2 ${
                      googleConnected ? 'text-gray-700' : 'text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Export to Google Docs</span>
                    {!googleConnected && <span className="text-xs">(Connect Google)</span>}
                  </button>
                  <button
                    onClick={() => handleExportToGoogle('sheets')}
                    disabled={!googleConnected}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2 ${
                      googleConnected ? 'text-gray-700' : 'text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Export to Google Sheets</span>
                    {!googleConnected && <span className="text-xs">(Connect Google)</span>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="p-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing your document or use AI to generate content..."
            className="w-full h-96 p-4 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm leading-relaxed"
          />
        </div>
      </div>

      <AIModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onGenerate={handleAIGenerate}
      />
    </div>
  );
};

export default DocEditor;