import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import type { Review } from '../types/api';
import { apiClient } from '../lib/api-client';
import { sanitizeText } from '../lib/sanitize';
import { toast } from 'sonner';
import { useConfirm } from '../hooks/useConfirm';

export const ReviewDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const { confirm, dialog } = useConfirm();

  const fetchReview = async () => {
    if (!id) return;
    try {
      const res = await apiClient.get<Review>(`/reviews/${id}`);
      setReview(res.data);
    } catch (err) {
      console.error('Error fetching review:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReview();
  }, [id]);

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Delete review',
      message: 'Are you sure you want to delete this review? This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/reviews/${id}`);
      toast.success('Review deleted');
      navigate('/products');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to delete review.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-20 text-center font-mono text-xs uppercase tracking-[.16em] text-zinc-500">Loading review...</div>;
  }

  if (!review) {
    return (
      <div className="ui-surface mx-auto my-12 max-w-7xl space-y-4 rounded-2xl px-4 py-16 text-center">
        <p className="font-mono text-[10px] font-bold tracking-[.16em] text-zinc-500">RECORD UNAVAILABLE</p>
        <h2 className="text-xl font-black text-zinc-100">Review not found</h2>
        <button onClick={() => navigate('/products')} className="btn-primary text-xs">Return to Catalog</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            Review Details
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">View and manage this review</p>
        </div>
        <button onClick={() => navigate('/products')} className="btn-primary text-xs font-bold py-2 px-6">
          Back to Catalog
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="ui-surface p-6 rounded-sm border border-zinc-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Review Content</h2>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${star <= review.rating ? 'text-amber-500 fill-amber-500' : 'text-zinc-300'}`}
                  />
                ))}
              </div>
            </div>
            <p className="text-zinc-100 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: sanitizeText(review.comment || '') }} />
          </div>

          {review.product_id && (
            <div className="ui-surface p-6 rounded-sm border border-zinc-700">
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider mb-3 border-b border-zinc-700 pb-2">Product Reference</h3>
              <p className="text-zinc-300 text-sm">Product ID: <span className="font-mono text-zinc-100">{review.product_id.slice(0, 8)}</span></p>
              <p className="text-zinc-400 text-xs mt-1">Use this ID to navigate to the product page</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="ui-surface p-6 rounded-sm border border-zinc-700">
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider mb-4 border-b border-zinc-700 pb-3">Review Metadata</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-400">Review ID</dt>
                <dd className="font-mono text-zinc-100">{review.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-400">User ID</dt>
                <dd className="font-mono text-zinc-100">{review.user_id.slice(0, 8)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-400">Rating</dt>
                <dd className="flex items-center gap-1">
                  <span className="font-bold text-zinc-100">{review.rating}/5</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className={`w-4 h-4 ${star <= review.rating ? 'text-amber-500 fill-amber-500' : 'text-zinc-300'}`} />
                  ))}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-400">Created</dt>
                <dd className="text-zinc-100">{review.created_at ? new Date(review.created_at).toLocaleString() : 'Unknown'}</dd>
              </div>
            </dl>
          </div>

          <div className="ui-surface p-6 rounded-sm border border-zinc-700 border-rose-500/50">
            <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider mb-4 border-b border-zinc-700 pb-3">Danger Zone</h3>
            <p className="text-xs text-zinc-400 mb-4">Once deleted, this review cannot be recovered.</p>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="btn-danger text-xs font-bold py-2 px-4 disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete Review'}
            </button>
          </div>
        </div>
      </div>
      {dialog}
    </div>
  );
};