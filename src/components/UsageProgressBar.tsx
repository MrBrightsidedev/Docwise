import React from 'react';
import { TrendingUp, AlertTriangle } from 'lucide-react';

interface UsageProgressBarProps {
  used: number;
  limit: number;
  label: string;
  type?: 'default' | 'warning' | 'danger';
  showUpgrade?: boolean;
  onUpgrade?: () => void;
}

const UsageProgressBar: React.FC<UsageProgressBarProps> = ({
  used,
  limit,
  label,
  type = 'default',
  showUpgrade = false,
  onUpgrade
}) => {
  const percentage = limit === -1 ? 0 : Math.min((used / limit) * 100, 100);
  const isUnlimited = limit === -1;
  
  const getColorClasses = () => {
    if (isUnlimited) return 'bg-green-500';
    if (type === 'danger' || percentage >= 90) return 'bg-red-500';
    if (type === 'warning' || percentage >= 75) return 'bg-yellow-500';
    return 'bg-primary-500';
  };

  const getBackgroundClasses = () => {
    if (isUnlimited) return 'bg-green-100';
    if (type === 'danger' || percentage >= 90) return 'bg-red-100';
    if (type === 'warning' || percentage >= 75) return 'bg-yellow-100';
    return 'bg-gray-200';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {percentage >= 90 && !isUnlimited && (
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            {isUnlimited ? `${used} used` : `${used}/${limit}`}
          </span>
          {isUnlimited && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
              Unlimited
            </span>
          )}
        </div>
      </div>
      
      {!isUnlimited && (
        <div className="w-full">
          <div className={`w-full h-2 rounded-full ${getBackgroundClasses()}`}>
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getColorClasses()}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          {percentage >= 90 && showUpgrade && (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-red-600">
                Approaching limit
              </span>
              {onUpgrade && (
                <button
                  onClick={onUpgrade}
                  className="text-xs bg-primary-600 text-white px-3 py-1 rounded-full hover:bg-primary-700 transition-colors flex items-center space-x-1"
                >
                  <TrendingUp className="h-3 w-3" />
                  <span>Upgrade</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UsageProgressBar;