import React from 'react';
import { Check } from 'lucide-react';

interface PlanCardProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  buttonText: string;
  onSelect: () => void;
}

const PlanCard: React.FC<PlanCardProps> = ({
  name,
  price,
  description,
  features,
  isPopular = false,
  buttonText,
  onSelect,
}) => {
  return (
    <div className={`relative bg-white rounded-2xl border-2 p-8 ${
      isPopular ? 'border-primary-500 shadow-lg' : 'border-gray-200'
    }`}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
      )}
      
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{name}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        <div className="mb-6">
          <span className="text-4xl font-bold text-gray-900">{price}</span>
          {price !== 'Free' && <span className="text-gray-600">/month</span>}
        </div>
      </div>

      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center space-x-3">
            <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onSelect}
        className={`w-full py-3 px-6 rounded-xl font-semibold transition-colors ${
          isPopular
            ? 'bg-primary-600 text-white hover:bg-primary-700'
            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
        }`}
      >
        {buttonText}
      </button>
    </div>
  );
};

export default PlanCard;