import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ShoppingCart, ArrowLeft } from 'lucide-react';
import type { Product, ProductVariant, Review } from '../types/api';
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

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!id) return;
      try {
        const [prodRes, revRes] = await Promise.all([
          apiClient.get<Product>(`/products/${id}`),
          apiClient.get<Review[]>(`/reviews/product/${id}`),
        ]);
        setProduct(prodRes.data);
        setReviews(revRes.data);
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

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400">Loading item details...</div>;
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-200">Product Not Found</h2>
        <button onClick={() => navigate('/products')} className="px-4 py-2 bg-indigo-600 rounded-xl text-white">
          Back to Storefront
        </button>
      </div>
    );
  }

  const basePrice = Number(product.base_price);
  const priceModifier = selectedVariant ? Number(selectedVariant.price_modifier) : 0;
  const totalPrice = basePrice + priceModifier;
  const inStock = selectedVariant ? selectedVariant.stock_quantity > 0 : false;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Back Button */}
      <button
        onClick={() => navigate('/products')}
        className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Storefront</span>
      </button>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Gallery */}
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="w-full h-96 bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800">
            {product.images?.[0]?.image_url ? (
              <img src={product.images[0].image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="text-slate-600 font-mono">IMAGE PREVIEW</div>
            )}
          </div>
        </div>

        {/* Product Information */}
        <div className="space-y-6">
          <div>
            <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold uppercase tracking-wider">
              {product.category?.name || 'Catalog Item'}
            </span>
            <h1 className="text-3xl font-extrabold text-white mt-3">{product.name}</h1>
            <p className="text-slate-400 mt-2">{product.description || 'No detailed description available.'}</p>
          </div>

          {/* Pricing */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 uppercase font-mono">Price</span>
              <div className="text-3xl font-bold text-white font-mono">${totalPrice.toFixed(2)}</div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              inStock ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
            }`}>
              {inStock ? `${selectedVariant?.stock_quantity} IN STOCK` : 'OUT OF STOCK'}
            </span>
          </div>

          {/* Variant Selector */}
          {product.variants?.length > 0 && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Select Variant / SKU</label>
              <div className="grid grid-cols-2 gap-3">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      selectedVariant?.id === variant.id
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-xs font-mono font-bold text-slate-200">SKU: {variant.sku}</div>
                    <div className="text-xs text-indigo-400 font-mono mt-1">
                      +${Number(variant.price_modifier).toFixed(2)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add to Cart Action */}
          <div className="flex items-center space-x-4 pt-4">
            <button
              onClick={() => selectedVariant && addItem(selectedVariant.id, 1)}
              disabled={!inStock || !selectedVariant}
              className="flex-1 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-40"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Add to Cart</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="glass-panel p-8 rounded-3xl space-y-8">
        <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
          <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
          <span>Customer Reviews ({reviews.length})</span>
        </h2>

        {/* Submit Review Form */}
        {user ? (
          <form onSubmit={handleReviewSubmit} className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Leave a Review</h3>
            
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1"
                >
                  <Star className={`w-6 h-6 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                </button>
              ))}
            </div>

            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write your review comments here..."
              className="w-full p-4 bg-slate-950/60 border border-slate-700/60 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
            />

            <button
              type="submit"
              disabled={submittingReview}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all"
            >
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        ) : (
          <p className="text-sm text-slate-400 italic">Please sign in to write a review.</p>
        )}

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-slate-500 text-sm">No reviews yet for this product.</p>
          ) : (
            reviews.map((rev) => (
              <div key={rev.id} className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${s <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-slate-500">Verified Buyer</span>
                </div>
                <p className="text-sm text-slate-300">{rev.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
