import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description }) => {
  return (
    <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="bg-primary-100 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6">
        <Icon className="h-8 w-8 text-primary-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-4">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
};

export default FeatureCard;