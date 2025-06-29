import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Download, Edit, RotateCcw, Loader2, Bot, User } from 'lucide-react';
import { generateDocument } from '../lib/gemini';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  onDocumentGenerated?: (content: string) => void;
}

const AIChat: React.FC<AIChatProps> = ({ onDocumentGenerated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your Legal Assistant AI v2.0 🤖. I can help you generate professional legal documents including GDPR-compliant privacy policies, NDAs, contracts, and agreements. What would you like to create today?',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastGeneratedContent, setLastGeneratedContent] = useState<string>('');
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

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    addMessage('user', userMessage);
    setIsLoading(true);

    try {
      // Determine document type from user message
      const documentType = detectDocumentType(userMessage);
      
      // Determine country/jurisdiction from message
      const country = detectCountry(userMessage);
      
      const result = await generateDocument(
        userMessage,
        documentType,
        country,
        'startup' // Default to startup, could be made configurable
      );

      if (result.success && result.content) {
        setLastGeneratedContent(result.content);
        const documentTypeLabel = getDocumentTypeLabel(documentType);
        addMessage('assistant', `I've generated a ${documentTypeLabel} document based on your requirements. Here's what I created:\n\n${result.content}`);
      } else if (result.limit_reached) {
        addMessage('assistant', result.error || 'AI generation limit reached. Please upgrade your plan to continue generating documents.');
      } else {
        addMessage('assistant', 'I apologize, but I encountered an issue generating your document. Could you please try rephrasing your request or provide more specific details?');
      }
    } catch (error) {
      addMessage('assistant', 'I\'m sorry, but I\'m having trouble processing your request right now. Please try again in a moment.');
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
    } else if (lowerMessage.includes('terms of service') || lowerMessage.includes('tos')) {
      return 'terms';
    } else if (lowerMessage.includes('license') || lowerMessage.includes('licensing')) {
      return 'licensing';
    } else if (lowerMessage.includes('vendor') || lowerMessage.includes('supplier')) {
      return 'vendor';
    }
    
    return 'nda'; // Default fallback
  };

  const detectCountry = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('netherlands') || lowerMessage.includes('dutch') || lowerMessage.includes('nl')) {
      return 'Netherlands';
    } else if (lowerMessage.includes('united states') || lowerMessage.includes('usa') || lowerMessage.includes('us')) {
      return 'US';
    } else if (lowerMessage.includes('united kingdom') || lowerMessage.includes('uk') || lowerMessage.includes('britain')) {
      return 'UK';
    } else if (lowerMessage.includes('germany') || lowerMessage.includes('german') || lowerMessage.includes('de')) {
      return 'DE';
    } else if (lowerMessage.includes('france') || lowerMessage.includes('french') || lowerMessage.includes('fr')) {
      return 'FR';
    } else if (lowerMessage.includes('canada') || lowerMessage.includes('canadian') || lowerMessage.includes('ca')) {
      return 'CA';
    } else if (lowerMessage.includes('australia') || lowerMessage.includes('australian') || lowerMessage.includes('au')) {
      return 'AU';
    } else if (lowerMessage.includes('singapore') || lowerMessage.includes('sg')) {
      return 'SG';
    } else if (lowerMessage.includes('gdpr') || lowerMessage.includes('european') || lowerMessage.includes('eu')) {
      return 'Netherlands'; // Default to Netherlands for GDPR requests
    }
    
    return 'Netherlands'; // Default to Netherlands (GDPR compliant)
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

  const handleDownloadPDF = () => {
    // TODO: Implement PDF download functionality
    alert('PDF download feature coming soon!');
  };

  const handleEditTerms = () => {
    if (lastGeneratedContent && onDocumentGenerated) {
      onDocumentGenerated(lastGeneratedContent);
      setIsOpen(false);
    }
  };

  const handleRegenerate = () => {
    if (messages.length >= 2) {
      const lastUserMessage = messages.filter(m => m.type === 'user').pop();
      if (lastUserMessage) {
        setInputValue(lastUserMessage.content);
      }
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-primary-600 text-white p-4 rounded-full shadow-lg hover:bg-primary-700 transition-colors z-40"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-primary-600 text-white rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Legal Assistant AI v2.0</h3>
                  <p className="text-xs opacity-90">Enhanced GDPR Compliance • Ready to help</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded-lg transition-colors"
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
                    <span className="text-sm text-gray-600">Generating document...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Action Buttons */}
          {lastGeneratedContent && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <div className="flex space-x-2">
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center space-x-1 px-3 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="h-3 w-3" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={handleEditTerms}
                  className="flex items-center space-x-1 px-3 py-2 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Edit className="h-3 w-3" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={handleRegenerate}
                  className="flex items-center space-x-1 px-3 py-2 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Regenerate</span>
                </button>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me to generate any legal document or privacy policy..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChat;