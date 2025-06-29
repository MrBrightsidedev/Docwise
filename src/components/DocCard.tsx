import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Calendar, MoreVertical } from 'lucide-react';

interface DocCardProps {
  id: string;
  title: string;
  createdAt: string;
  content: string;
}

const DocCard: React.FC<DocCardProps> = ({ id, title, createdAt, content }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getPreview = (content: string) => {
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
  };

  return (
    <Link
      to={`/editor/${id}`}
      className="block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all duration-200 hover:border-gray-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-primary-100 p-2 rounded-lg">
            <FileText className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
            <div className="flex items-center space-x-1 text-sm text-gray-500 mt-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(createdAt)}</span>
            </div>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600 p-1">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
      <p className="text-gray-600 text-sm leading-relaxed">{getPreview(content)}</p>
    </Link>
  );
};

export default DocCard;