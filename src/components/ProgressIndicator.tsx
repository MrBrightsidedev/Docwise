import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  id: string;
  name: string;
  status: 'complete' | 'current' | 'upcoming';
}

interface ProgressIndicatorProps {
  steps: Step[];
  className?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ steps, className = '' }) => {
  return (
    <nav aria-label="Progress" className={className}>
      <ol className="flex items-center">
        {steps.map((step, stepIdx) => (
          <li key={step.id} className={stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}>
            <div className="flex items-center">
              <div className="relative flex h-8 w-8 items-center justify-center">
                {step.status === 'complete' ? (
                  <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                    <Check className="h-5 w-5 text-white" />
                  </div>
                ) : step.status === 'current' ? (
                  <div className="h-8 w-8 rounded-full border-2 border-primary-600 bg-white flex items-center justify-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-primary-600" />
                  </div>
                ) : (
                  <div className="h-8 w-8 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-transparent" />
                  </div>
                )}
              </div>
              <div className="ml-4 min-w-0">
                <p className={`text-sm font-medium ${
                  step.status === 'complete' ? 'text-primary-600' :
                  step.status === 'current' ? 'text-primary-600' :
                  'text-gray-500'
                }`}>
                  {step.name}
                </p>
              </div>
              {stepIdx !== steps.length - 1 && (
                <div className="absolute top-4 left-8 -ml-px h-0.5 w-full bg-gray-300" />
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default ProgressIndicator;