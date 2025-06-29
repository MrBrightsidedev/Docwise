import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { stripeProducts } from '../stripe-config';
import CheckoutButton from '../components/CheckoutButton';
import { Check } from 'lucide-react';

const Pricing: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleFreeSelect = () => {
    if (!user) {
      navigate('/signup');
      return;
    }
    navigate('/dashboard');
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const getFeatures = (productName: string) => {
    switch (productName) {
      case 'Test subscription pro':
        return [
          'Unlimited documents',
          '10 AI generations per month',
          'PDF & Google Docs export',
          'Advanced templates',
          'Priority support',
          'Team collaboration',
        ];
      case 'Enterprise test subscription':
        return [
          'Everything in Pro',
          'Unlimited AI generations',
          'Custom templates',
          'API access',
          'Dedicated support',
          'Advanced analytics',
          'White-label options',
        ];
      default:
        return [];
    }
  };

  const freePlan = {
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
  };

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
          {/* Free Plan */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{freePlan.name}</h3>
              <p className="text-gray-600 mb-4">{freePlan.description}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">{freePlan.price}</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              {freePlan.features.map((feature, index) => (
                <li key={index} className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={handleFreeSelect}
              className="w-full py-3 px-6 rounded-xl font-semibold transition-colors bg-gray-100 text-gray-900 hover:bg-gray-200"
            >
              {user ? 'Current Plan' : 'Get Started'}
            </button>
          </div>

          {/* Stripe Products */}
          {stripeProducts.map((product, index) => {
            const isPopular = product.name === 'Test subscription pro';
            const features = getFeatures(product.name);

            return (
              <div
                key={product.id}
                className={`relative bg-white rounded-2xl border-2 p-8 ${
                  isPopular ? 'border-primary-500 shadow-lg' : 'border-gray-200'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h3>
                  <p className="text-gray-600 mb-4">{product.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">
                      {formatPrice(product.price, product.currency)}
                    </span>
                    <span className="text-gray-600">/month</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {user ? (
                  <CheckoutButton
                    product={product}
                    className={`w-full py-3 px-6 rounded-xl font-semibold transition-colors ${
                      isPopular
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    Upgrade to {product.name}
                  </CheckoutButton>
                ) : (
                  <button
                    onClick={() => navigate('/signup')}
                    className={`w-full py-3 px-6 rounded-xl font-semibold transition-colors ${
                      isPopular
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    Get Started
                  </button>
                )}
              </div>
            );
          })}
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