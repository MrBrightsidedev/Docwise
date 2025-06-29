import React, { useState } from 'react';
import { X, Wand2, Loader2 } from 'lucide-react';

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (content: string) => void;
}

const AIModal: React.FC<AIModalProps> = ({ isOpen, onClose, onGenerate }) => {
  const [prompt, setPrompt] = useState('');
  const [templateType, setTemplateType] = useState('nda');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      // Simulate AI generation - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockContent = `# ${templateType.toUpperCase()} Agreement

## Parties
This agreement is entered into between the parties as specified below.

## Purpose
${prompt}

## Terms and Conditions
1. **Confidentiality**: All information shared between parties shall remain confidential.
2. **Duration**: This agreement shall remain in effect for a period of [DURATION].
3. **Obligations**: Each party agrees to fulfill their respective obligations as outlined.

## Signatures
By signing below, both parties agree to the terms and conditions set forth in this agreement.

_Party 1 Signature: _________________ Date: _________

_Party 2 Signature: _________________ Date: _________

---
*This document was generated using AI assistance and should be reviewed by legal counsel before use.*`;

      onGenerate(mockContent);
      setPrompt('');
      onClose();
    } catch (error) {
      console.error('Error generating document:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary-100 p-2 rounded-lg">
                <Wand2 className="h-6 w-6 text-primary-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Generate with AI</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Type
            </label>
            <select
              value={templateType}
              onChange={(e) => setTemplateType(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="nda">Non-Disclosure Agreement (NDA)</option>
              <option value="contract">Service Contract</option>
              <option value="agreement">Partnership Agreement</option>
              <option value="terms">Terms of Service</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe your requirements
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., Create an NDA for a software development project between two companies, with a 2-year confidentiality period..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={6}
            />
          </div>

          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  <span>Generate Document</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIModal;