import React, { useState, useEffect } from 'react';
import { Save, Download, Wand2, FileText } from 'lucide-react';
import AIModal from './AIModal';

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

  useEffect(() => {
    setTitle(initialTitle);
    setContent(initialContent);
  }, [initialTitle, initialContent]);

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

  const handleExport = (format: string) => {
    // Placeholder for export functionality
    alert(`Export to ${format} coming soon!`);
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
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
              <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 hidden group-hover:block">
                <button
                  onClick={() => handleExport('PDF')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Export as PDF
                </button>
                <button
                  onClick={() => handleExport('Google Docs')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-500 cursor-not-allowed"
                >
                  Google Docs (Coming Soon)
                </button>
              </div>
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