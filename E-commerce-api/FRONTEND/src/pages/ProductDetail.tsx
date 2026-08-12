import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Pencil, Star, ShoppingCart, ArrowLeft, Trash2, Zap } from 'lucide-react';
import type { Product, ProductVariant, Review, PaginatedResponse } from '../types/api';
import { apiClient } from '../lib/api-client';
import { useCartStore } from '../store/cartStore';
import { useAuth } from '../context/AuthContext';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCartStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [loading, setLoading] = useState(true);

  // Review Form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!id) return;
      try {
        const [prodRes, revRes] = await Promise.all([
          apiClient.get<Product>(`/products/${id}`),
          apiClient.get<PaginatedResponse<Review>>('/reviews/', { params: { product_id: id } }),
        ]);
        setProduct(prodRes.data);
        setReviews(revRes.data.items);
        if (prodRes.data.variants?.length > 0) {
          setSelectedVariant(prodRes.data.variants[0]);
        }
      } catch (err) {
        console.error('Error loading product details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProductDetails();
  }, [id]);

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
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const startReviewEdit = (review: Review) => {
    setEditingReviewId(review.id);
    setRating(review.rating);
    setComment(review.comment || '');
  };

  const saveReviewEdit = async () => {
    if (!editingReviewId) return;
    try {
      const response = await apiClient.patch<Review>(`/reviews/${editingReviewId}`, { rating, comment });
      setReviews((current) => current.map((review) => review.id === editingReviewId ? response.data : review));
      setEditingReviewId(null); setComment(''); setRating(5);
    } catch (err: any) { alert(err.response?.data?.detail || 'Failed to update review.'); }
  };

  const deleteReview = async (reviewId: string) => {
    if (!confirm('Delete this review?')) return;
    try { await apiClient.delete(`/reviews/${reviewId}`); setReviews((current) => current.filter((review) => review.id !== reviewId)); }
    catch (err: any) { alert(err.response?.data?.detail || 'Failed to delete review.'); }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-zinc-400 font-medium">Loading product details...</div>;
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4 ui-surface rounded-sm my-8">
        <h2 className="text-xl font-bold text-zinc-100">Product Not Found</h2>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Back Button */}
      <button
        onClick={() => navigate('/products')}
        className="flex items-center space-x-2 text-zinc-400 hover:text-zinc-100 text-xs font-semibold transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Storefront</span>
      </button>

      {/* Main Details Showcase (White Surface Container) */}
      <div className="ui-surface p-6 sm:p-8 rounded-sm grid grid-cols-1 lg:grid-cols-2 gap-8 shadow-xs">
        
        {/* Product Image Gallery */}
        <div className="space-y-4">
          <div className="w-full h-80 sm:h-96 bg-zinc-900 rounded-sm overflow-hidden flex items-center justify-center border border-zinc-700 relative">
            {product.images?.[0]?.image_url ? (
              <img src={product.images[0].image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="text-zinc-400 font-mono text-xs">NO IMAGE PREVIEW</div>
            )}
          </div>
        </div>

        {/* Product Meta & Actions */}
        <div className="space-y-6">
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-xs bg-zinc-900 text-zinc-200 border border-zinc-700 text-[11px] font-bold uppercase tracking-wider">
              {product.category?.name || 'General Catalog'}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 mt-2">{product.name}</h1>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              {product.description || 'No detailed product description available for this item.'}
            </p>
          </div>

          {/* Pricing Card */}
          <div className="p-4 rounded-sm bg-zinc-900/60 border border-zinc-700 space-y-1">
            <div className="flex items-baseline space-x-3">
              <span className="text-3xl font-black text-zinc-100">
                Rs. {totalPrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="pt-2 flex items-center">
              <span className={`px-2 py-0.5 rounded-xs text-[11px] font-bold uppercase border ${
                inStock ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {inStock ? `${selectedVariant?.available_quantity} ITEMS IN STOCK` : 'OUT OF STOCK'}
              </span>
            </div>
          </div>

          {/* Variant Selector */}
          {product.variants?.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-100 uppercase tracking-wider">Available Variants</label>
              <div className="grid grid-cols-2 gap-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    className={`p-2.5 rounded-sm text-left border text-xs transition-all ${
                      selectedVariant?.id === variant.id
                        ? 'bg-zinc-800 border-zinc-700 text-zinc-100 font-bold'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-100 hover:border-zinc-500'
                    }`}
                  >
                    <div className="font-mono font-semibold">SKU: {variant.sku}</div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      Price modifier: +Rs. {Number(variant.price_modifier).toFixed(2)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => selectedVariant && addItem(selectedVariant.id, 1)}
              disabled={!inStock || !selectedVariant}
              className="flex-1 py-3 px-4 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 border border-zinc-700 font-bold text-sm rounded-xs flex items-center justify-center space-x-2 transition-colors disabled:opacity-40"
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
              className="btn-primary flex-1 py-3 px-4 text-sm rounded-xs flex items-center justify-center space-x-2 shadow-xs disabled:opacity-40"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Buy Now</span>
            </button>
          </div>
        </div>

      </div>

      {/* Customer Reviews Section */}
      <div className="ui-surface p-6 rounded-sm space-y-6 shadow-xs">
        <h3 className="text-lg font-bold text-zinc-100 flex items-center space-x-2 border-b border-zinc-700 pb-3">
          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          <span>Ratings & Reviews ({reviews.length})</span>
        </h3>

        {/* Submit Review Form */}
        {user ? (
          <form onSubmit={handleReviewSubmit} className="p-4 rounded-sm bg-zinc-900/50 border border-zinc-700 space-y-3">
            <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">{editingReviewId ? 'Edit Your Review' : 'Leave a Review'}</h4>
            
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-0.5"
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
              className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded-xs text-xs text-zinc-100 placeholder-gray-400 focus:outline-none focus:border-zinc-700"
            />

            <div className="flex gap-2">
              <button type={editingReviewId ? 'button' : 'submit'} onClick={editingReviewId ? saveReviewEdit : undefined} disabled={submittingReview} className="btn-primary text-xs py-2 px-4">{editingReviewId ? 'Save Review' : submittingReview ? 'Submitting...' : 'Submit Review'}</button>
              {editingReviewId && <button type="button" onClick={() => { setEditingReviewId(null); setComment(''); setRating(5); }} className="px-3 py-2 border border-zinc-700 text-xs font-semibold text-zinc-400 rounded-xs">Cancel</button>}
            </div>
          </form>
        ) : (
          <p className="text-xs text-zinc-400 italic">Please sign in to post a review.</p>
        )}

        {/* Reviews List */}
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <p className="text-zinc-400 text-xs">No reviews submitted yet.</p>
          ) : (
            reviews.map((rev) => (
              <div key={rev.id} className="p-3 rounded-xs border border-zinc-700 space-y-1 bg-zinc-900">
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
                <p className="text-xs text-zinc-100 mt-1">{rev.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
