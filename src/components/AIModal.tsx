import React, { useState } from 'react';
import { X, Wand2, Loader2, Globe, Building } from 'lucide-react';
import { generateDocument } from '../lib/gemini';

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (content: string) => void;
}

const AIModal: React.FC<AIModalProps> = ({ isOpen, onClose, onGenerate }) => {
  const [prompt, setPrompt] = useState('');
  const [templateType, setTemplateType] = useState('nda');
  const [country, setCountry] = useState('Netherlands');
  const [businessType, setBusinessType] = useState('startup');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    
    try {
      const result = await generateDocument(prompt, templateType, country, businessType);
      
      if (result.success && result.content) {
        onGenerate(result.content);
        setPrompt('');
        onClose();
      } else if (result.limit_reached) {
        setError(result.error || 'AI generation limit reached. Please upgrade your plan.');
      } else {
        setError(result.error || 'Failed to generate document. Please try again.');
      }
    } catch (error) {
      console.error('Error generating document:', error);
      setError('Failed to generate document. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const documentTypes = [
    { value: 'nda', label: 'Non-Disclosure Agreement (NDA)' },
    { value: 'privacy', label: 'Privacy Policy (GDPR Compliant)' },
    { value: 'terms', label: 'Terms of Service' },
    { value: 'partnership', label: 'Partnership Agreement' },
    { value: 'employment', label: 'Employment Agreement' },
    { value: 'service', label: 'Service Contract' },
    { value: 'freelance', label: 'Freelance Contract' },
    { value: 'consulting', label: 'Consulting Agreement' },
    { value: 'licensing', label: 'Licensing Agreement' },
    { value: 'vendor', label: 'Vendor Agreement' },
  ];

  const countries = [
    { value: 'Netherlands', label: '🇳🇱 Netherlands (GDPR)' },
    { value: 'US', label: '🇺🇸 United States (CCPA)' },
    { value: 'UK', label: '🇬🇧 United Kingdom (UK-GDPR)' },
    { value: 'DE', label: '🇩🇪 Germany (GDPR)' },
    { value: 'FR', label: '🇫🇷 France (GDPR)' },
    { value: 'CA', label: '🇨🇦 Canada (PIPEDA)' },
    { value: 'AU', label: '🇦🇺 Australia (Privacy Act)' },
    { value: 'SG', label: '🇸🇬 Singapore (PDPA)' },
    { value: 'International', label: '🌍 International/Generic' },
  ];

  const businessTypes = [
    { value: 'startup', label: 'Startup/Small Business' },
    { value: 'saas', label: 'SaaS Company' },
    { value: 'ecommerce', label: 'E-commerce Business' },
    { value: 'corporation', label: 'Corporation' },
    { value: 'llc', label: 'LLC' },
    { value: 'freelancer', label: 'Freelancer/Individual' },
    { value: 'nonprofit', label: 'Non-Profit Organization' },
    { value: 'partnership', label: 'Partnership' },
  ];

  const getPromptPlaceholder = () => {
    if (templateType === 'privacy') {
      return 'E.g., Create a GDPR-compliant privacy policy for an AI-powered document generation SaaS platform that collects user emails, subscription data, and analytics. The service uses Supabase for data storage, Stripe for payments, and is hosted on Vercel. Include cookie policy and DPO information...';
    } else if (templateType === 'terms') {
      return 'E.g., Create terms of service for a SaaS platform offering AI document generation. Include subscription terms, usage limitations, intellectual property rights, and liability disclaimers...';
    } else if (templateType === 'partnership') {
      return 'E.g., Create a partnership agreement for two developers building a mobile app together. Include 50/50 profit sharing, IP ownership, roles and responsibilities, and exit strategy...';
    }
    return 'E.g., Create an NDA for a software development project between two companies, with a 2-year confidentiality period, covering proprietary algorithms and customer data...';
  };

  const getDocumentDescription = () => {
    if (templateType === 'privacy') {
      return 'Generate a comprehensive privacy policy with full GDPR compliance, including all 15 required sections, legal basis for processing, and jurisdiction-specific requirements.';
    } else if (templateType === 'terms') {
      return 'Create terms of service with comprehensive coverage of user obligations, service limitations, payment terms, and legal protections.';
    } else if (templateType === 'partnership') {
      return 'Draft a partnership agreement covering contributions, profit sharing, IP ownership, roles, and exit strategies.';
    }
    return 'Generate a professional legal document tailored to your specific requirements and jurisdiction.';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary-100 p-2 rounded-lg">
                <Wand2 className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Universal Legal AI Assistant v1.0</h2>
                <p className="text-sm text-gray-600">Multi-jurisdictional legal document generation with enhanced compliance</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Type
              </label>
              <select
                value={templateType}
                onChange={(e) => setTemplateType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {documentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">{getDocumentDescription()}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
                <Globe className="h-4 w-4" />
                <span>Jurisdiction</span>
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {countries.map((country) => (
                  <option key={country.value} value={country.value}>
                    {country.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Legal framework and compliance requirements will be adapted to your jurisdiction.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
              <Building className="h-4 w-4" />
              <span>Business Type</span>
            </label>
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {businessTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe your requirements
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={getPromptPlaceholder()}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={6}
            />
            <p className="text-xs text-gray-500 mt-2">
              Be specific about parties involved, data types (for privacy policies), duration, key terms, and any special requirements.
            </p>
          </div>

          {templateType === 'privacy' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-medium text-blue-900 mb-2">🔒 Enhanced Privacy Policy Features:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Full GDPR compliance with all 15 required sections</li>
                <li>• Legal basis for processing under Article 6</li>
                <li>• Specific data examples and retention periods</li>
                <li>• Cookie policy integration</li>
                <li>• International data transfer clauses (SCCs, adequacy decisions)</li>
                <li>• DPO requirements assessment</li>
                <li>• Jurisdiction-specific adaptations</li>
              </ul>
            </div>
          )}

          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <h4 className="font-medium text-green-900 mb-2">🤖 Universal Legal AI v1.0 Features:</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Multi-jurisdictional legal document generation</li>
              <li>• Adaptive to international law (GDPR, CCPA, UK-GDPR, PIPEDA)</li>
              <li>• Context-aware document structuring</li>
              <li>• Professional formatting with markdown support</li>
              <li>• Complete legal clauses and requirements</li>
              <li>• Jurisdiction-specific legal language</li>
              <li>• Enhanced compliance checking</li>
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm text-amber-800">
              <strong>Legal Disclaimer:</strong> AI-generated documents should be reviewed by qualified legal counsel before use. 
              This tool provides templates and suggestions, not legal advice. Ensure compliance with local laws and regulations.
            </p>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
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