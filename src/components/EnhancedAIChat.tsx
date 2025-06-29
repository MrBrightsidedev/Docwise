import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, X, Send, Loader2, Bot, User, Sparkles, 
  Save, FileText, Edit3, Download, RotateCcw, Upload,
  Mic, MicOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { generateDocument } from '../lib/gemini';
import QuickActions from './QuickActions';
import Toast from './Toast';
import { useToast } from '../hooks/useToast';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: ChatAction[];
}

interface ChatAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning';
}

const EnhancedAIChat: React.FC = () => {
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
  const [lastGeneratedContent, setLastGeneratedContent] = useState<string>('');
  const [lastDocumentId, setLastDocumentId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (type: 'user' | 'assistant', content: string, actions?: ChatAction[]) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      actions
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

  const saveAsDraft = async () => {
    if (!lastGeneratedContent) return;
    
    const title = `Draft Document - ${new Date().toLocaleDateString()}`;
    const documentId = await createDocumentInDatabase(title, lastGeneratedContent);
    
    if (documentId) {
      showToast('success', 'Document saved as draft!');
      setLastDocumentId(documentId);
    } else {
      showToast('error', 'Failed to save draft');
    }
  };

  const editDocument = () => {
    if (lastDocumentId) {
      navigate(`/editor/${lastDocumentId}`);
      setIsOpen(false);
    } else if (lastGeneratedContent) {
      // Create document first, then navigate to editor
      createDocumentInDatabase('New Document', lastGeneratedContent).then(id => {
        if (id) {
          navigate(`/editor/${id}`);
          setIsOpen(false);
        }
      });
    }
  };

  const downloadDocument = () => {
    if (!lastGeneratedContent) return;
    
    const blob = new Blob([lastGeneratedContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'legal-document.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('success', 'Document downloaded!');
  };

  const generateNewVersion = () => {
    if (messages.length >= 2) {
      const lastUserMessage = messages.filter(m => m.type === 'user').pop();
      if (lastUserMessage) {
        setInputValue(lastUserMessage.content + ' (generate a new version)');
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setInputValue(`Please review and improve this document: ${content.substring(0, 1000)}...`);
    };
    reader.readAsText(file);
  };

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      showToast('warning', 'Voice input not supported in this browser');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      showToast('error', 'Voice input failed');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    if (!user) {
      showToast('warning', 'Please sign in to generate legal documents.');
      navigate('/login');
      return;
    }

    const userMessage = inputValue.trim();
    setInputValue('');
    setShowQuickActions(false);
    addMessage('user', userMessage);
    setIsLoading(true);

    try {
      const documentType = detectDocumentType(userMessage);
      const country = detectCountry(userMessage);
      const businessType = detectBusinessType(userMessage);
      
      const result = await generateDocument(userMessage, documentType, country, businessType);

      if (result.success && result.content) {
        const documentTypeLabel = getDocumentTypeLabel(documentType);
        const documentTitle = generateDocumentTitle(documentType, country);
        
        setLastGeneratedContent(result.content);
        
        const actions: ChatAction[] = [
          {
            id: 'save',
            label: 'Save Document',
            icon: Save,
            onClick: async () => {
              const documentId = await createDocumentInDatabase(documentTitle, result.content);
              if (documentId) {
                setLastDocumentId(documentId);
                showToast('success', 'Document saved successfully!');
                setIsRedirecting(true);
                setTimeout(() => {
                  setIsOpen(false);
                  navigate(`/dashboard?highlight=${documentId}`);
                }, 1500);
              }
            },
            variant: 'primary'
          },
          {
            id: 'draft',
            label: 'Keep as Draft',
            icon: FileText,
            onClick: saveAsDraft,
            variant: 'secondary'
          },
          {
            id: 'edit',
            label: 'Edit Document',
            icon: Edit3,
            onClick: editDocument,
            variant: 'success'
          },
          {
            id: 'download',
            label: 'Download',
            icon: Download,
            onClick: downloadDocument,
            variant: 'secondary'
          },
          {
            id: 'regenerate',
            label: 'Generate New Version',
            icon: RotateCcw,
            onClick: generateNewVersion,
            variant: 'warning'
          }
        ];
        
        addMessage('assistant', `✅ I've successfully generated a ${documentTypeLabel} document for ${country} jurisdiction. Here's what I created:\n\n${result.content.substring(0, 500)}...`, actions);
      } else if (result.limit_reached) {
        addMessage('assistant', result.error || 'AI generation limit reached. Please upgrade your plan to continue generating documents.');
        showToast('warning', 'AI generation limit reached. Please upgrade your plan.');
      } else {
        addMessage('assistant', 'I apologize, but I encountered an issue generating your document. Could you please try rephrasing your request or provide more specific details?');
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

  const handleQuickAction = (prompt: string) => {
    setInputValue(prompt);
    setShowQuickActions(false);
  };

  // Detection functions (same as before)
  const detectDocumentType = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('privacy policy') || lowerMessage.includes('privacy') || lowerMessage.includes('gdpr')) return 'privacy';
    if (lowerMessage.includes('nda') || lowerMessage.includes('non-disclosure')) return 'nda';
    if (lowerMessage.includes('partnership')) return 'partnership';
    if (lowerMessage.includes('terms of service') || lowerMessage.includes('tos')) return 'terms';
    return 'nda';
  };

  const detectCountry = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('netherlands') || lowerMessage.includes('dutch')) return 'Netherlands';
    if (lowerMessage.includes('united states') || lowerMessage.includes('usa')) return 'US';
    if (lowerMessage.includes('united kingdom') || lowerMessage.includes('uk')) return 'UK';
    return 'Netherlands';
  };

  const detectBusinessType = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('startup')) return 'startup';
    if (lowerMessage.includes('corporation')) return 'corporation';
    if (lowerMessage.includes('saas')) return 'saas';
    return 'startup';
  };

  const getDocumentTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'privacy': 'GDPR-Compliant Privacy Policy',
      'nda': 'Non-Disclosure Agreement (NDA)',
      'partnership': 'Partnership Agreement',
      'terms': 'Terms of Service'
    };
    return labels[type] || type.toUpperCase();
  };

  const generateDocumentTitle = (type: string, country: string): string => {
    const typeLabels: Record<string, string> = {
      'privacy': 'Privacy Policy',
      'nda': 'Non-Disclosure Agreement',
      'partnership': 'Partnership Agreement',
      'terms': 'Terms of Service'
    };
    return `${typeLabels[type] || 'Legal Document'} (${country})`;
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getActionButtonClasses = (variant: string = 'secondary') => {
    const baseClasses = 'flex items-center space-x-1 px-3 py-1 text-xs rounded-lg transition-colors';
    switch (variant) {
      case 'primary':
        return `${baseClasses} bg-primary-600 text-white hover:bg-primary-700`;
      case 'success':
        return `${baseClasses} bg-green-600 text-white hover:bg-green-700`;
      case 'warning':
        return `${baseClasses} bg-yellow-600 text-white hover:bg-yellow-700`;
      default:
        return `${baseClasses} bg-gray-600 text-white hover:bg-gray-700`;
    }
  };

  if (!user) return null;

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 z-40 group"
          title="Enhanced Legal Assistant AI"
        >
          <div className="relative">
            <MessageCircle className="h-6 w-6" />
            <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
          </div>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[700px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold flex items-center space-x-1">
                    <span>Enhanced Legal AI v2.0</span>
                    <Sparkles className="h-4 w-4 text-yellow-300" />
                  </h3>
                  <p className="text-xs opacity-90">Advanced Features • Multi-Jurisdictional</p>
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

          {/* Quick Actions */}
          {showQuickActions && (
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h4>
              <QuickActions onAction={handleQuickAction} />
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                  <div
                    className={`p-3 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  
                  {/* Message Actions */}
                  {message.actions && message.actions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {message.actions.map((action) => {
                        const Icon = action.icon;
                        return (
                          <button
                            key={action.id}
                            onClick={action.onClick}
                            className={getActionButtonClasses(action.variant)}
                          >
                            <Icon className="h-3 w-3" />
                            <span>{action.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2 mt-1">
                    {message.type === 'assistant' && <Bot className="h-3 w-3 text-gray-400" />}
                    {message.type === 'user' && <User className="h-3 w-3 text-gray-400" />}
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
            <div className="flex items-center space-x-2 mb-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                title="Upload document"
              >
                <Upload className="h-4 w-4" />
              </button>
              <button
                onClick={startVoiceInput}
                disabled={isListening}
                className={`p-2 transition-colors ${
                  isListening 
                    ? 'text-red-600 animate-pulse' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Voice input"
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
            </div>
            
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me to generate any legal document..."
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
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <p className="text-xs text-gray-500 mt-2 text-center">
              Enhanced with voice input, file upload, and advanced actions
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

export default EnhancedAIChat;