import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Pencil, Star, ShoppingCart, ArrowLeft, Trash2, Zap } from 'lucide-react';
import type { Product, ProductVariant, Review, PaginatedResponse } from '../types/api';
import { apiClient } from '../lib/api-client';
import { useCartStore } from '../store/cartStore';
import { useAuth } from '../context/useAuth';
import { ProductVisual } from '../components/product/ProductVisual';
import { formatPrice } from '../lib/format-price';
import { sanitizeText } from '../lib/sanitize';
import { toast } from 'sonner';
import { useConfirm } from '../hooks/useConfirm';
import { SkeletonCard } from '../components/ui/Skeleton';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCartStore();
  const { confirm, dialog } = useConfirm();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [existingReview, setExistingReview] = useState<Review | null>(null);

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!id) return;
      try {
        const [prodRes, revRes] = await Promise.all([
          apiClient.get<Product>(`/products/${id}`),
          apiClient.get<PaginatedResponse<Review>>(`/reviews/`, { params: { product_id: id } }),
        ]);
        setProduct(prodRes.data);
        const fetchedReviews = revRes.data.items;
        setReviews(fetchedReviews);
        if (prodRes.data.variants?.length > 0) {
          setSelectedVariant(prodRes.data.variants[0]);
        }
        if (user) {
          const mine = fetchedReviews.find((r) => r.user_id === user.id);
          if (mine) {
            setExistingReview(mine);
            setEditingReviewId(mine.id);
            setRating(mine.rating);
            setComment(mine.comment || '');
          } else {
            setExistingReview(null);
            setEditingReviewId(null);
            setRating(5);
            setComment('');
          }
        }
      } catch (err) {
        console.error('Error loading product details:', err);
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchProductDetails();
  }, [id, user]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user) return;
    setSubmittingReview(true);
    try {
      const res = await apiClient.post<Review>('/reviews/', {
        product_id: id,
        rating,
        comment,
      });
      setReviews([res.data, ...reviews]);
      setComment('');
      setRating(5);
      setExistingReview(res.data);
      setEditingReviewId(res.data.id);
      toast.success('Review submitted');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const startReviewEdit = (review: Review) => {
    setEditingReviewId(review.id);
    setRating(review.rating);
    setComment(review.comment || '');
  };

  const cancelReviewEdit = () => {
    if (existingReview) {
      setEditingReviewId(existingReview.id);
      setRating(existingReview.rating);
      setComment(existingReview.comment || '');
    } else {
      setEditingReviewId(null);
      setComment('');
      setRating(5);
    }
  };

  const saveReviewEdit = async () => {
    if (!editingReviewId) return;
    try {
      const response = await apiClient.patch<Review>(`/reviews/${editingReviewId}`, { rating, comment });
      setReviews((current) => current.map((review) => review.id === editingReviewId ? response.data : review));
      setEditingReviewId(null); setComment(''); setRating(5);
      setExistingReview(response.data);
      toast.success('Review updated');
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Failed to update review.'); }
  };

  const deleteReview = async (reviewId: string) => {
    const ok = await confirm({
      title: 'Delete review',
      message: 'Are you sure you want to delete this review? This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try { await apiClient.delete(`/reviews/${reviewId}`); setReviews((current) => current.filter((review) => review.id !== reviewId)); toast.success('Review deleted'); }
    catch (err: any) { toast.error(err.response?.data?.detail || 'Failed to delete review.'); }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20">
        <SkeletonCard />
      </div>
    );
  }

  if (fetchError || !product) {
    return (
      <div className="ui-surface mx-auto my-12 max-w-7xl space-y-4 rounded-2xl px-4 py-16 text-center">
        <p className="font-mono text-[10px] font-bold tracking-[.16em] text-zinc-500">RECORD UNAVAILABLE</p>
        <h2 className="text-xl font-black text-zinc-100">Product not found</h2>
        <button onClick={() => navigate('/products')} className="btn-primary text-xs">
          Return to Storefront
        </button>
      </div>
    );
  }

  const basePrice = Number(product.base_price);
  const priceModifier = selectedVariant ? Number(selectedVariant.price_modifier) : 0;
  const totalPrice = basePrice + priceModifier;
  const inStock = selectedVariant ? selectedVariant.available_quantity > 0 : false;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      
      {/* Back Button */}
      <button
        onClick={() => navigate('/products')}
        className="ui-icon-button flex w-fit items-center gap-2 px-2 py-1 text-xs font-bold"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to catalog</span>
      </button>

      <div className="ui-surface grid grid-cols-1 gap-5 rounded-2xl p-4 sm:p-6 lg:grid-cols-[1.05fr_.95fr] lg:gap-8 lg:p-8">
        
        {/* Product Image Gallery */}
        <div className="min-w-0">
          <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
            <ProductVisual product={product} priority />
          </div>
        </div>

        {/* Product Meta & Actions */}
        <div className="flex min-w-0 flex-col justify-center space-y-6 py-2">
          <div>
            <span className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 font-mono text-[10px] font-bold tracking-[.16em] text-zinc-400">
              SPEC // {product.category?.name || 'GENERAL CATALOG'}
            </span>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-zinc-50 sm:text-4xl">{product.name}</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">
              {product.description || 'No detailed product description available for this item.'}
            </p>
          </div>

          {/* Pricing Card */}
          <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-mono text-[10px] font-bold tracking-[.14em] text-zinc-500">CURRENT PRICE</span>
              <span className="font-mono text-2xl font-black text-zinc-100 sm:text-3xl">
                {formatPrice(totalPrice)}
              </span>
            </div>

            <div className="flex items-center border-t border-zinc-800 pt-3">
              <span className={`ui-status px-2 py-1 font-mono text-[10px] font-bold tracking-[.12em] ${
                inStock ? 'border-emerald-800/50 bg-emerald-950/60 text-emerald-400' : 'border-rose-800/50 bg-rose-950/60 text-rose-300'
              }`}>
                {inStock ? `${selectedVariant?.available_quantity} ITEMS IN STOCK` : 'OUT OF STOCK'}
              </span>
            </div>
          </div>

          {/* Variant Selector */}
          {product.variants?.length > 0 && (
            <div className="space-y-2">
              <label className="block font-mono text-[10px] font-bold uppercase tracking-[.16em] text-zinc-500">Available variants</label>
              <div className="grid grid-cols-2 gap-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    aria-pressed={selectedVariant?.id === variant.id}
                    className={`rounded-lg border p-3 text-left text-xs transition-colors ${
                      selectedVariant?.id === variant.id
                        ? 'border-zinc-100 bg-zinc-100 text-zinc-950 font-bold'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-200 hover:border-zinc-600'
                    }`}
                  >
                    <div className="font-mono font-semibold">SKU: {variant.sku}</div>
                    <div className={`mt-1 text-[11px] ${selectedVariant?.id === variant.id ? 'text-zinc-700' : 'text-zinc-500'}`}>
                      Price modifier: +Rs. {Number(variant.price_modifier).toFixed(2)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-col gap-3 border-t border-zinc-800 pt-5 sm:flex-row">
            <button
              onClick={() => selectedVariant && addItem(selectedVariant.id, 1)}
              disabled={!inStock || !selectedVariant}
              className="btn-accent flex-1 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Add to Cart</span>
            </button>

            <button
              onClick={() => {
                if (selectedVariant) {
                  addItem(selectedVariant.id, 1);
                  navigate('/checkout');
                }
              }}
              disabled={!inStock || !selectedVariant}
              className="btn-primary flex-1 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Buy Now</span>
            </button>
          </div>
        </div>

      </div>

      {/* Customer Reviews Section */}
      <div className="ui-surface space-y-6 rounded-2xl p-5 sm:p-6">
        <h3 className="flex items-center gap-2 border-b border-zinc-800 pb-4 text-lg font-black text-zinc-100">
          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          <span>Ratings & Reviews ({reviews.length})</span>
        </h3>

        {/* Review Form */}
        {user && (
          <form onSubmit={editingReviewId ? undefined : handleReviewSubmit} className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <h4 className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-zinc-500">{editingReviewId ? 'Edit your review' : 'Leave a review'}</h4>

            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="ui-icon-button p-0.5"
                  aria-label={`Rate ${star} out of 5`}
                  aria-pressed={star <= rating}
                >
                  <Star className={`w-5 h-5 ${star <= rating ? 'text-amber-500 fill-amber-500' : 'text-zinc-300'}`} />
                </button>
              ))}
            </div>

            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this product..."
              className="ui-input min-h-24 p-3 text-xs"
            />

            <div className="flex gap-2">
              {editingReviewId ? (
                <>
                  <button type="button" onClick={saveReviewEdit} disabled={submittingReview} className="btn-primary text-xs py-2 px-4">{submittingReview ? 'Saving...' : 'Save Review'}</button>
                  <button type="button" onClick={cancelReviewEdit} className="btn-accent px-3 py-2 text-xs">Cancel</button>
                </>
              ) : (
                <button type="submit" disabled={submittingReview} className="btn-primary text-xs py-2 px-4">{submittingReview ? 'Submitting...' : 'Submit Review'}</button>
              )}
            </div>
          </form>
        )}

        {/* Reviews List */}
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <p className="text-zinc-400 text-xs">No reviews submitted yet.</p>
          ) : (
            reviews.map((rev) => (
              <div key={rev.id} className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${s <= rev.rating ? 'text-amber-500 fill-amber-500' : 'text-zinc-300'}`}
                      />
                    ))}
                  </div>
                  {(user?.id === rev.user_id || user?.role === 'admin') && (
                    <div className="flex gap-2">
                      {user?.id === rev.user_id && <button onClick={() => startReviewEdit(rev)} className="text-zinc-400 hover:text-zinc-100" aria-label="Edit review"><Pencil className="w-3.5 h-3.5" /></button>}
                      <button onClick={() => deleteReview(rev.id)} className="text-zinc-400 hover:text-rose-600" aria-label="Delete review"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-zinc-100 mt-1" dangerouslySetInnerHTML={{ __html: sanitizeText(rev.comment || '') }} />
              </div>
            ))
          )}
        </div>
      </div>
      {dialog}
    </div>
  );
};