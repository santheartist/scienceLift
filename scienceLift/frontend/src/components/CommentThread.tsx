/**
 * Comment thread component - Professional UI with full nesting support
 */

import React, { useState } from 'react';
import { FiThumbsUp, FiMessageCircle, FiTrash2, FiChevronUp } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/context/AuthContext';

interface Comment {
  id: number;
  content: string;
  author: {
    id: number;
    username: string;
    profile_picture_url?: string;
  };
  created_at: string;
  likes_count: number;
  is_liked_by_user: boolean;
  replies?: Comment[];
}

interface CommentThreadProps {
  comment: Comment;
  paperId: number;
  onReply: (parentId: number) => void;
  onDelete: (commentId: number) => void;
  onLike: (commentId: number) => void;
  level?: number;
}

export const CommentThread: React.FC<CommentThreadProps> = ({
  comment,
  paperId,
  onReply,
  onDelete,
  onLike,
  level = 0,
}) => {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [liking, setLiking] = useState(false);
  const hasReplies = comment.replies && comment.replies.length > 0;

  if (collapsed) {
    return (
      <div 
        onClick={() => setCollapsed(false)}
        className="flex items-center gap-3 py-2 px-3 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 dark:hover:from-slate-800/50 dark:hover:to-slate-700/50 rounded-lg cursor-pointer transition group"
      >
        <FiChevronUp className="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-purple-400 rotate-90 transition" />
        <img
          src={`${comment.author?.profile_picture_url}?t=${Date.now()}`}
          alt={comment.author?.username}
          className="w-6 h-6 rounded-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <span className="text-sm text-gray-600 dark:text-slate-400">
          <span className="font-semibold text-gray-900 dark:text-slate-100">{comment.author?.username}</span> 
          {' '} • {' '}
          <span className="text-xs">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
        </span>
        <span className="text-xs text-gray-400 dark:text-slate-500 ml-auto">Expand</span>
      </div>
    );
  }

  const handleLike = async () => {
    setLiking(true);
    try {
      onLike(comment.id);
    } finally {
      setLiking(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      onDelete(comment.id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={`${level > 0 ? 'ml-4 pl-4 border-l-2 border-gradient-to-b border-blue-200/50 dark:border-purple-500/30' : ''}`}>
      <div className={`mb-4 rounded-lg transition ${
        level === 0 
          ? 'bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-purple-500/30 shadow-sm hover:shadow-md' 
          : 'bg-gray-50/50 dark:bg-slate-700/30 border border-gray-100 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/50'
      }`}>
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-shrink-0 mt-0.5">
              {comment.author?.profile_picture_url ? (
                <img
                  src={`${comment.author.profile_picture_url}?t=${Date.now()}`}
                  alt={comment.author.username}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-200 dark:ring-purple-500/30 shadow-sm"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {comment.author?.username?.[0].toUpperCase() || '?'}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-sm text-gray-900 dark:text-slate-100">
                  {comment.author?.username || 'Unknown User'}
                </p>
                <span className="text-xs text-gray-500 dark:text-slate-400">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </span>
                {user && user.id === comment.author?.id && (
                  <span className="text-xs bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full font-semibold border border-blue-200 dark:border-blue-500/30 shadow-sm">
                    You
                  </span>
                )}
              </div>
            </div>

            {user && user.id === comment.author?.id && (
              <button
                onClick={() => setCollapsed(true)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition p-1"
                title="Collapse"
              >
                <FiChevronUp className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Comment content */}
          <p className="text-gray-700 dark:text-slate-200 text-sm mb-4 leading-relaxed break-words">
            {comment.content}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleLike}
              disabled={liking}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition text-xs font-semibold ${
                comment.is_liked_by_user
                  ? 'bg-gradient-to-r from-orange-100 to-yellow-100 dark:from-orange-900/40 dark:to-yellow-900/40 text-orange-600 dark:text-orange-300 border border-orange-200 dark:border-orange-500/30'
                  : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-600/50 border border-gray-200 dark:border-slate-600/50'
              } disabled:opacity-50 transition`}
              title={comment.is_liked_by_user ? 'Unlike' : 'Like'}
            >
              <FiThumbsUp size={14} />
              <span>{comment.likes_count}</span>
            </button>

            <button
              onClick={() => onReply(comment.id)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-gray-600 dark:text-slate-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 rounded-lg transition border border-gray-200 dark:border-slate-600/50 hover:border-blue-300 dark:hover:border-blue-500/50"
            >
              <FiMessageCircle size={14} />
              Reply
            </button>

            {user && user.id === comment.author?.id && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition border border-red-200 dark:border-red-500/30 hover:border-red-300 dark:hover:border-red-500/50 disabled:opacity-50"
              >
                <FiTrash2 size={14} />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Nested replies */}
      {hasReplies && (
        <div className="space-y-0">
          {comment.replies?.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              paperId={paperId}
              onReply={onReply}
              onDelete={onDelete}
              onLike={onLike}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
