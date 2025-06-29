import React, { useState } from 'react';
import { Trash2, Download, Archive, Share2, CheckSquare, Square } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

interface BulkActionsProps {
  selectedItems: string[];
  totalItems: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDelete: (ids: string[]) => Promise<void>;
  onDownload: (ids: string[]) => Promise<void>;
  onArchive?: (ids: string[]) => Promise<void>;
  onShare?: (ids: string[]) => Promise<void>;
}

const BulkActions: React.FC<BulkActionsProps> = ({
  selectedItems,
  totalItems,
  onSelectAll,
  onDeselectAll,
  onDelete,
  onDownload,
  onArchive,
  onShare
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const isAllSelected = selectedItems.length === totalItems && totalItems > 0;
  const isPartiallySelected = selectedItems.length > 0 && selectedItems.length < totalItems;

  const handleSelectToggle = () => {
    if (isAllSelected) {
      onDeselectAll();
    } else {
      onSelectAll();
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onDelete(selectedItems);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      await onDownload(selectedItems);
    } catch (error) {
      console.error('Error downloading items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!onArchive) return;
    setLoading(true);
    try {
      await onArchive(selectedItems);
    } catch (error) {
      console.error('Error archiving items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!onShare) return;
    setLoading(true);
    try {
      await onShare(selectedItems);
    } catch (error) {
      console.error('Error sharing items:', error);
    } finally {
      setLoading(false);
    }
  };

  if (selectedItems.length === 0) {
    return (
      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
        <button
          onClick={handleSelectToggle}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <Square className="h-4 w-4" />
          <span className="text-sm">Select all</span>
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between p-3 bg-primary-50 border border-primary-200 rounded-lg">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSelectToggle}
            className="flex items-center space-x-2 text-primary-700 hover:text-primary-900 transition-colors"
          >
            {isAllSelected ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <div className="relative">
                <Square className="h-4 w-4" />
                {isPartiallySelected && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-primary-600 rounded-sm" />
                  </div>
                )}
              </div>
            )}
            <span className="text-sm font-medium">
              {selectedItems.length} of {totalItems} selected
            </span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownload}
            disabled={loading}
            className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Download className="h-3 w-3" />
            <span>Download</span>
          </button>

          {onArchive && (
            <button
              onClick={handleArchive}
              disabled={loading}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              <Archive className="h-3 w-3" />
              <span>Archive</span>
            </button>
          )}

          {onShare && (
            <button
              onClick={handleShare}
              disabled={loading}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <Share2 className="h-3 w-3" />
              <span>Share</span>
            </button>
          )}

          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={loading}
            className="flex items-center space-x-1 px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Selected Documents"
        message={`Are you sure you want to delete ${selectedItems.length} document${selectedItems.length > 1 ? 's' : ''}? This action cannot be undone.`}
        type="danger"
        confirmText="Delete"
        loading={loading}
      />
    </>
  );
};

export default BulkActions;