import React from 'react';

interface LoadingSkeletonProps {
  count?: number;
  className?: string;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ count = 3, className = '' }) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
          <div className="flex items-start space-x-3 mb-4">
            <div className="bg-gray-200 w-10 h-10 rounded-lg"></div>
            <div className="flex-1">
              <div className="bg-gray-200 h-5 rounded w-3/4 mb-2"></div>
              <div className="bg-gray-200 h-4 rounded w-1/2"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="bg-gray-200 h-4 rounded w-full"></div>
            <div className="bg-gray-200 h-4 rounded w-5/6"></div>
            <div className="bg-gray-200 h-4 rounded w-2/3"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;