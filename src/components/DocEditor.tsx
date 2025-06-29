import React, { useState, useEffect } from 'react';
import { Save, Download, Wand2, FileText, ExternalLink, Sparkles, Loader2, History } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { summarizeDocument } from '../lib/gemini';
import AIModal from './AIModal';
import DocumentVersioning from './DocumentVersioning';
import ConfirmationModal from './ConfirmationModal';
import Toast from './Toast';
import { useToast } from '../hooks/useToast';

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
  const { user } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showSummaryMenu, setShowSummaryMenu] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [showSummary, setShowSummary] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Mock versions data - in real app, this would come from the database
  const [versions] = useState([
    {
      id: '1',
      version: '1.0',
      createdAt: new Date().toISOString(),
      changes: 'Initial document creation',
      size: content.length
    },
    {
      id: '2',
      version: '1.1',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      changes: 'Added confidentiality clauses',
      size: content.length + 200
    }
  ]);

  useEffect(() => {
    setTitle(initialTitle);
    setContent(initialContent);
  }, [initialTitle, initialContent]);

  useEffect(() => {
    setHasUnsavedChanges(
      title !== initialTitle || content !== initialContent
    );
  }, [title, content, initialTitle, initialContent]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled || !hasUnsavedChanges) return;

    const autoSaveTimer = setTimeout(() => {
      handleSave(true);
    }, 30000); // Auto-save every 30 seconds

    return () => clearTimeout(autoSaveTimer);
  }, [title, content, autoSaveEnabled, hasUnsavedChanges]);

  const isGoogleConnected = user?.app_metadata?.provider === 'google';

  const handleSave = async (isAutoSave = false) => {
    setIsSaving(true);
    try {
      await onSave(title, content);
      setHasUnsavedChanges(false);
      if (!isAutoSave) {
        showToast('success', 'Document saved successfully!');
      }
    } catch (error) {
      showToast('error', 'Failed to save document. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveWithConfirmation = () => {
    if (hasUnsavedChanges) {
      setShowSaveConfirmation(true);
    } else {
      showToast('info', 'No changes to save.');
    }
  };

  const handleAIGenerate = (generatedContent: string) => {
    setContent(generatedContent);
    setHasUnsavedChanges(true);
    showToast('success', 'AI content generated successfully!');
  };

  const handleSummarize = async (summaryType: 'brief' | 'detailed' | 'key_points') => {
    if (!content.trim()) {
      showToast('warning', 'Please add some content to summarize.');
      return;
    }

    setIsSummarizing(true);
    setShowSummaryMenu(false);

    try {
      const result = await summarizeDocument(documentId, content, summaryType);
      
      if (result.success && result.summary) {
        setSummary(result.summary);
        setShowSummary(true);
        showToast('success', 'Document summarized successfully!');
      } else if (result.limit_reached) {
        showToast('warning', result.error || 'AI generation limit reached. Please upgrade your plan.');
      } else {
        showToast('error', result.error || 'Failed to summarize document.');
      }
    } catch (error) {
      showToast('error', 'Failed to summarize document. Please try again.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleExportToPDF = () => {
    showToast('warning', 'PDF export coming soon!');
    setShowExportMenu(false);
  };

  const handleExportToGoogle = async (exportType: 'docs' | 'sheets') => {
    if (!isGoogleConnected) {
      showToast('warning', 'Please sign in with Google to export to Google Workspace. You can do this from the Account Settings page.');
      return;
    }

    setIsExporting(true);
    setShowExportMenu(false);

    try {
      showToast('success', `Google ${exportType === 'docs' ? 'Docs' : 'Sheets'} export will be available soon! Your Google account is connected and ready.`);
    } catch (error) {
      console.error('Export error:', error);
      showToast('error', 'Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleVersionRevert = (versionId: string) => {
    showToast('info', `Reverting to version ${versionId} - Feature coming soon!`);
  };

  const handleVersionCompare = (versionId: string) => {
    showToast('info', `Comparing with version ${versionId} - Feature coming soon!`);
  };

  const handleVersionDownload = (versionId: string) => {
    showToast('info', `Downloading version ${versionId} - Feature coming soon!`);
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
              onChange={(e) => {
                setTitle(e.target.value);
                setHasUnsavedChanges(true);
              }}
              placeholder="Document Title"
              className="text-2xl font-bold text-gray-900 bg-transparent border-none outline-none flex-1 mr-4"
            />
            <div className="flex items-center space-x-3">
              {hasUnsavedChanges && (
                <span className="text-sm text-yellow-600 flex items-center space-x-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>Unsaved changes</span>
                </span>
              )}
              <button
                onClick={() => setIsAIModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg"
              >
                <Wand2 className="h-4 w-4" />
                <span>Generate with AI</span>
              </button>
              <button
                onClick={handleSaveWithConfirmation}
                disabled={isSaving || !hasUnsavedChanges}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors shadow-md hover:shadow-lg"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>{isSaving ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Auto-save toggle */}
              <label className="flex items-center space-x-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={autoSaveEnabled}
                  onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                  className="rounded"
                />
                <span>Auto-save</span>
              </label>

              {/* Summarize Menu */}
              <div className="relative">
                <button 
                  onClick={() => setShowSummaryMenu(!showSummaryMenu)}
                  disabled={isSummarizing || !content.trim()}
                  className="flex items-center space-x-2 px-4 py-2 border border-purple-300 text-purple-700 rounded-xl hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSummarizing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  <span>{isSummarizing ? 'Summarizing...' : 'Summarize'}</span>
                </button>
                
                {showSummaryMenu && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-10">
                    <button
                      onClick={() => handleSummarize('brief')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Brief Summary
                    </button>
                    <button
                      onClick={() => handleSummarize('detailed')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Detailed Summary
                    </button>
                    <button
                      onClick={() => handleSummarize('key_points')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Key Points
                    </button>
                  </div>
                )}
              </div>

              {/* Export Menu */}
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
                      disabled={!isGoogleConnected}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2 ${
                        isGoogleConnected ? 'text-gray-700' : 'text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Export to Google Docs</span>
                      {!isGoogleConnected && <span className="text-xs">(Sign in with Google)</span>}
                    </button>
                    <button
                      onClick={() => handleExportToGoogle('sheets')}
                      disabled={!isGoogleConnected}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2 ${
                        isGoogleConnected ? 'text-gray-700' : 'text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Export to Google Sheets</span>
                      {!isGoogleConnected && <span className="text-xs">(Sign in with Google)</span>}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Version History Button */}
            <button
              onClick={() => setShowVersions(!showVersions)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <History className="h-4 w-4" />
              <span>Versions</span>
            </button>
          </div>
        </div>

        {/* Summary Display */}
        {showSummary && summary && (
          <div className="border-b border-gray-200 p-6 bg-purple-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-purple-900 flex items-center space-x-2">
                <Sparkles className="h-5 w-5" />
                <span>AI Summary</span>
              </h3>
              <button
                onClick={() => setShowSummary(false)}
                className="text-purple-600 hover:text-purple-800 text-sm font-medium"
              >
                Hide
              </button>
            </div>
            <div className="bg-white rounded-xl p-4 border border-purple-200">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{summary}</p>
            </div>
          </div>
        )}

        {/* Version History */}
        {showVersions && (
          <div className="border-b border-gray-200 p-6 bg-gray-50">
            <DocumentVersioning
              documentId={documentId}
              versions={versions}
              currentVersion="1.0"
              onRevert={handleVersionRevert}
              onCompare={handleVersionCompare}
              onDownload={handleVersionDownload}
            />
          </div>
        )}

        {/* Editor */}
        <div className="p-6">
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setHasUnsavedChanges(true);
            }}
            placeholder="Start writing your document or use AI to generate content..."
            className="w-full h-96 p-4 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm leading-relaxed"
          />
          <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
            <span>{content.length} characters</span>
            {autoSaveEnabled && hasUnsavedChanges && (
              <span>Auto-save in 30 seconds</span>
            )}
          </div>
        </div>
      </div>

      <AIModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onGenerate={handleAIGenerate}
      />

      <ConfirmationModal
        isOpen={showSaveConfirmation}
        onClose={() => setShowSaveConfirmation(false)}
        onConfirm={() => {
          handleSave();
          setShowSaveConfirmation(false);
        }}
        title="Save Document"
        message="Are you sure you want to save the current changes to this document?"
        type="success"
        confirmText="Save Changes"
        loading={isSaving}
      />

      {/* Click outside to close menus */}
      {(showExportMenu || showSummaryMenu) && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => {
            setShowExportMenu(false);
            setShowSummaryMenu(false);
          }}
        />
      )}

      <Toast
        type={toast.type}
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
};

export default DocEditor;