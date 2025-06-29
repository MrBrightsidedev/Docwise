import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PlanCard from '../components/PlanCard';

const Pricing: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handlePlanSelect = (plan: string) => {
    if (!user) {
      navigate('/signup');
      return;
    }

    if (plan === 'free') {
      navigate('/dashboard');
    } else {
      // Placeholder for RevenueCat integration
      alert(`${plan} plan integration coming soon! This will integrate with RevenueCat for billing.`);
    }
  };

  const plans = [
    {
      name: 'Free',
      price: 'Free',
      description: 'Perfect for trying out Docwise',
      features: [
        '3 document generations',
        '1 AI generation per month',
        'PDF export',
        'Basic templates',
        'Email support',
      ],
      buttonText: user ? 'Current Plan' : 'Get Started',
      onSelect: () => handlePlanSelect('free'),
    },
    {
      name: 'Pro',
      price: '$19',
      description: 'Best for small businesses',
      features: [
        'Unlimited documents',
        '10 AI generations per month',
        'PDF & Google Docs export',
        'Advanced templates',
        'Priority support',
        'Team collaboration',
      ],
      isPopular: true,
      buttonText: 'Upgrade to Pro',
      onSelect: () => handlePlanSelect('pro'),
    },
    {
      name: 'Business',
      price: '$49',
      description: 'For growing companies',
      features: [
        'Everything in Pro',
        'Unlimited AI generations',
        'Custom templates',
        'API access',
        'Dedicated support',
        'Advanced analytics',
        'White-label options',
      ],
      buttonText: 'Upgrade to Business',
      onSelect: () => handlePlanSelect('business'),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Start free and upgrade as your business grows. All plans include our core AI-powered document generation.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <PlanCard key={index} {...plan} />
          ))}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-xl p-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I change my plan anytime?
              </h3>
              <p className="text-gray-600">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-2">
                Are the AI-generated documents legally binding?
              </h3>
              <p className="text-gray-600">
                Our AI generates documents based on proven legal templates, but we recommend having them reviewed by legal counsel before use.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-2">
                What happens to my documents if I downgrade?
              </h3>
              <p className="text-gray-600">
                Your existing documents remain accessible. You'll only be limited by the new plan's generation limits going forward.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;