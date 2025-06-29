import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { generateDocument } from '../lib/gemini';
import Toast from './Toast';
import { useToast } from '../hooks/useToast';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const GlobalAIChat: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your Universal Legal Assistant AI v1.0 🤖. I can help you generate professional legal documents including GDPR-compliant privacy policies, NDAs, contracts, terms of service, and partnership agreements. I\'m trained on international law and can adapt to different jurisdictions. What would you like to create today?',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (type: 'user' | 'assistant', content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const createDocumentInDatabase = async (title: string, content: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .insert([
          {
            user_id: user?.id,
            title,
            content,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating document:', error);
      return null;
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    // Check if user is authenticated
    if (!user) {
      showToast('warning', 'Please sign in to generate legal documents.');
      navigate('/login');
      return;
    }

    const userMessage = inputValue.trim();
    setInputValue('');
    addMessage('user', userMessage);
    setIsLoading(true);

    try {
      // Determine document type from user message
      const documentType = detectDocumentType(userMessage);
      
      // Determine country/jurisdiction from message
      const country = detectCountry(userMessage);
      
      // Determine business type from message
      const businessType = detectBusinessType(userMessage);
      
      const result = await generateDocument(
        userMessage,
        documentType,
        country,
        businessType
      );

      if (result.success && result.content) {
        const documentTypeLabel = getDocumentTypeLabel(documentType);
        const documentTitle = generateDocumentTitle(documentType, country);
        
        addMessage('assistant', `✅ I've successfully generated a ${documentTypeLabel} document for ${country} jurisdiction. Creating your document now...`);
        
        // Create document in database
        const documentId = await createDocumentInDatabase(documentTitle, result.content);
        
        if (documentId) {
          setIsRedirecting(true);
          showToast('success', 'Document created! Redirecting to dashboard...');
          
          // Add final message
          addMessage('assistant', `🎉 Your ${documentTypeLabel} has been created and saved to your dashboard. Redirecting you now...`);
          
          // Redirect after a short delay
          setTimeout(() => {
            setIsOpen(false);
            navigate(`/dashboard?highlight=${documentId}`);
          }, 2000);
        } else {
          addMessage('assistant', `I've generated your ${documentTypeLabel}, but there was an issue saving it. Please try again or contact support.`);
          showToast('error', 'Failed to save document. Please try again.');
        }
      } else if (result.limit_reached) {
        addMessage('assistant', result.error || 'AI generation limit reached. Please upgrade your plan to continue generating documents.');
        showToast('warning', 'AI generation limit reached. Please upgrade your plan.');
      } else {
        addMessage('assistant', 'I apologize, but I encountered an issue generating your document. Could you please try rephrasing your request or provide more specific details about the jurisdiction and document requirements?');
        showToast('error', 'Failed to generate document. Please try again.');
      }
    } catch (error) {
      console.error('Error in AI chat:', error);
      addMessage('assistant', 'I\'m sorry, but I\'m having trouble processing your request right now. Please try again in a moment.');
      showToast('error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const detectDocumentType = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('privacy policy') || lowerMessage.includes('privacy') || lowerMessage.includes('gdpr') || lowerMessage.includes('data protection')) {
      return 'privacy';
    } else if (lowerMessage.includes('nda') || lowerMessage.includes('non-disclosure') || lowerMessage.includes('confidentiality')) {
      return 'nda';
    } else if (lowerMessage.includes('partnership') || lowerMessage.includes('partner')) {
      return 'partnership';
    } else if (lowerMessage.includes('employment') || lowerMessage.includes('job') || lowerMessage.includes('employee')) {
      return 'employment';
    } else if (lowerMessage.includes('service') || lowerMessage.includes('services')) {
      return 'service';
    } else if (lowerMessage.includes('freelance') || lowerMessage.includes('freelancer')) {
      return 'freelance';
    } else if (lowerMessage.includes('consulting') || lowerMessage.includes('consultant')) {
      return 'consulting';
    } else if (lowerMessage.includes('terms of service') || lowerMessage.includes('tos') || lowerMessage.includes('terms of use')) {
      return 'terms';
    } else if (lowerMessage.includes('license') || lowerMessage.includes('licensing')) {
      return 'licensing';
    } else if (lowerMessage.includes('vendor') || lowerMessage.includes('supplier')) {
      return 'vendor';
    } else if (lowerMessage.includes('saas') || lowerMessage.includes('software as a service')) {
      return 'terms';
    }
    
    return 'nda'; // Default fallback
  };

  const detectCountry = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('netherlands') || lowerMessage.includes('dutch') || lowerMessage.includes('nl') || lowerMessage.includes('amsterdam')) {
      return 'Netherlands';
    } else if (lowerMessage.includes('united states') || lowerMessage.includes('usa') || lowerMessage.includes('us') || lowerMessage.includes('america') || lowerMessage.includes('california') || lowerMessage.includes('new york')) {
      return 'US';
    } else if (lowerMessage.includes('united kingdom') || lowerMessage.includes('uk') || lowerMessage.includes('britain') || lowerMessage.includes('england') || lowerMessage.includes('london')) {
      return 'UK';
    } else if (lowerMessage.includes('germany') || lowerMessage.includes('german') || lowerMessage.includes('de') || lowerMessage.includes('berlin')) {
      return 'DE';
    } else if (lowerMessage.includes('france') || lowerMessage.includes('french') || lowerMessage.includes('fr') || lowerMessage.includes('paris')) {
      return 'FR';
    } else if (lowerMessage.includes('canada') || lowerMessage.includes('canadian') || lowerMessage.includes('ca') || lowerMessage.includes('toronto')) {
      return 'CA';
    } else if (lowerMessage.includes('australia') || lowerMessage.includes('australian') || lowerMessage.includes('au') || lowerMessage.includes('sydney')) {
      return 'AU';
    } else if (lowerMessage.includes('singapore') || lowerMessage.includes('sg')) {
      return 'SG';
    } else if (lowerMessage.includes('gdpr') || lowerMessage.includes('european') || lowerMessage.includes('eu')) {
      return 'Netherlands'; // Default to Netherlands for GDPR requests
    }
    
    return 'Netherlands'; // Default to Netherlands (GDPR compliant)
  };

  const detectBusinessType = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('startup') || lowerMessage.includes('start-up')) {
      return 'startup';
    } else if (lowerMessage.includes('corporation') || lowerMessage.includes('corp')) {
      return 'corporation';
    } else if (lowerMessage.includes('llc')) {
      return 'llc';
    } else if (lowerMessage.includes('freelance') || lowerMessage.includes('freelancer') || lowerMessage.includes('individual')) {
      return 'freelancer';
    } else if (lowerMessage.includes('nonprofit') || lowerMessage.includes('non-profit')) {
      return 'nonprofit';
    } else if (lowerMessage.includes('saas') || lowerMessage.includes('software')) {
      return 'saas';
    } else if (lowerMessage.includes('ecommerce') || lowerMessage.includes('e-commerce') || lowerMessage.includes('online store')) {
      return 'ecommerce';
    }
    
    return 'startup'; // Default fallback
  };

  const getDocumentTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'privacy': 'GDPR-Compliant Privacy Policy',
      'nda': 'Non-Disclosure Agreement (NDA)',
      'partnership': 'Partnership Agreement',
      'employment': 'Employment Agreement',
      'service': 'Service Contract',
      'freelance': 'Freelance Contract',
      'consulting': 'Consulting Agreement',
      'terms': 'Terms of Service',
      'licensing': 'Licensing Agreement',
      'vendor': 'Vendor Agreement'
    };
    return labels[type] || type.toUpperCase();
  };

  const generateDocumentTitle = (type: string, country: string): string => {
    const typeLabels: Record<string, string> = {
      'privacy': 'Privacy Policy',
      'nda': 'Non-Disclosure Agreement',
      'partnership': 'Partnership Agreement',
      'employment': 'Employment Agreement',
      'service': 'Service Contract',
      'freelance': 'Freelance Contract',
      'consulting': 'Consulting Agreement',
      'terms': 'Terms of Service',
      'licensing': 'Licensing Agreement',
      'vendor': 'Vendor Agreement'
    };
    
    const countryLabels: Record<string, string> = {
      'Netherlands': 'NL',
      'US': 'US',
      'UK': 'UK',
      'DE': 'DE',
      'FR': 'FR',
      'CA': 'CA',
      'AU': 'AU',
      'SG': 'SG'
    };
    
    const typeLabel = typeLabels[type] || 'Legal Document';
    const countryLabel = countryLabels[country] || country;
    
    return `${typeLabel} (${countryLabel})`;
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Don't render if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 z-40 group"
          title="Legal Assistant AI"
        >
          <div className="relative">
            <MessageCircle className="h-6 w-6" />
            <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
          </div>
          <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            💬 Legal Assistant
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold flex items-center space-x-1">
                    <span>Universal Legal AI v1.0</span>
                    <Sparkles className="h-4 w-4 text-yellow-300" />
                  </h3>
                  <p className="text-xs opacity-90">Multi-Jurisdictional • GDPR Compliant</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                disabled={isRedirecting}
                className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                  <div
                    className={`p-3 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    {message.type === 'assistant' && (
                      <Bot className="h-3 w-3 text-gray-400" />
                    )}
                    {message.type === 'user' && (
                      <User className="h-3 w-3 text-gray-400" />
                    )}
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(message.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-3 rounded-2xl">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
                    <span className="text-sm text-gray-600">
                      {isRedirecting ? 'Creating document...' : 'Generating legal document...'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me to generate any legal document for any jurisdiction..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                disabled={isLoading || isRedirecting}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading || isRedirecting}
                className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Documents are automatically saved to your dashboard
            </p>
          </div>
        </div>
      )}

      <Toast
        type={toast.type}
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </>
  );
};

export default GlobalAIChat;