import React, { useState } from 'react';
import { Clock, GitBranch, Eye, RotateCcw, Download } from 'lucide-react';

interface DocumentVersion {
  id: string;
  version: string;
  createdAt: string;
  changes: string;
  size: number;
}

interface DocumentVersioningProps {
  documentId: string;
  versions: DocumentVersion[];
  currentVersion: string;
  onRevert: (versionId: string) => void;
  onCompare: (versionId: string) => void;
  onDownload: (versionId: string) => void;
}

const DocumentVersioning: React.FC<DocumentVersioningProps> = ({
  documentId,
  versions,
  currentVersion,
  onRevert,
  onCompare,
  onDownload
}) => {
  const [showVersions, setShowVersions] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <GitBranch className="h-5 w-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">Document Versions</h3>
          <span className="text-sm text-gray-500">({versions.length} versions)</span>
        </div>
        <button
          onClick={() => setShowVersions(!showVersions)}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          {showVersions ? 'Hide' : 'Show'} Versions
        </button>
      </div>

      {showVersions && (
        <div className="space-y-3">
          {versions.map((version) => (
            <div
              key={version.id}
              className={`p-3 rounded-lg border ${
                version.version === currentVersion
                  ? 'border-primary-200 bg-primary-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900">
                      Version {version.version}
                    </span>
                    {version.version === currentVersion && (
                      <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(version.createdAt)}</span>
                    </div>
                    <span>{formatSize(version.size)}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{version.changes}</p>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => onCompare(version.id)}
                    className="p-1 text-gray-600 hover:text-gray-900 transition-colors"
                    title="Compare"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDownload(version.id)}
                    className="p-1 text-gray-600 hover:text-gray-900 transition-colors"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  {version.version !== currentVersion && (
                    <button
                      onClick={() => onRevert(version.id)}
                      className="p-1 text-gray-600 hover:text-gray-900 transition-colors"
                      title="Revert to this version"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentVersioning;