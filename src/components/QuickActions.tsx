import React from 'react';
import { FileText, Shield, Users, Briefcase, Download, Edit3 } from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  onClick: () => void;
}

interface QuickActionsProps {
  onAction: (action: string) => void;
  className?: string;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onAction, className = '' }) => {
  const actions: QuickAction[] = [
    {
      id: 'nda',
      label: 'Generate NDA',
      icon: Shield,
      description: 'Non-disclosure agreement',
      onClick: () => onAction('Generate an NDA for a software development project')
    },
    {
      id: 'privacy',
      label: 'Privacy Policy',
      icon: FileText,
      description: 'GDPR-compliant privacy policy',
      onClick: () => onAction('Create a GDPR-compliant privacy policy for a SaaS platform')
    },
    {
      id: 'partnership',
      label: 'Partnership Agreement',
      icon: Users,
      description: 'Business partnership contract',
      onClick: () => onAction('Generate a partnership agreement for two developers')
    },
    {
      id: 'terms',
      label: 'Terms of Service',
      icon: Briefcase,
      description: 'Website terms and conditions',
      onClick: () => onAction('Create terms of service for a web application')
    },
    {
      id: 'confidentiality',
      label: 'Add Confidentiality Clause',
      icon: Edit3,
      description: 'Enhance existing document',
      onClick: () => onAction('Add a confidentiality clause to my document')
    },
    {
      id: 'jurisdiction',
      label: 'Change Jurisdiction',
      icon: Download,
      description: 'Adapt to different country',
      onClick: () => onAction('Change the jurisdiction of my document to Netherlands')
    }
  ];

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 gap-3 ${className}`}>
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            onClick={action.onClick}
            className="p-3 bg-white border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 text-left group"
          >
            <div className="flex items-center space-x-2 mb-1">
              <Icon className="h-4 w-4 text-gray-600 group-hover:text-primary-600" />
              <span className="text-sm font-medium text-gray-900">{action.label}</span>
            </div>
            <p className="text-xs text-gray-500">{action.description}</p>
          </button>
        );
      })}
    </div>
  );
};

export default QuickActions;