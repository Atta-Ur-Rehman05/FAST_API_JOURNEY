import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ShoppingCart, ArrowLeft, ShieldCheck, Truck, Zap } from 'lucide-react';
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
    return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-[#757575] font-medium">Loading product details...</div>;
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4 ui-surface rounded-sm my-8">
        <h2 className="text-xl font-bold text-[#212121]">Product Not Found</h2>
        <button onClick={() => navigate('/products')} className="btn-primary text-xs">
          Return to Storefront
        </button>
      </div>
    );
  }

  const basePrice = Number(product.base_price);
  const priceModifier = selectedVariant ? Number(selectedVariant.price_modifier) : 0;
  const totalPrice = basePrice + priceModifier;
  const strikePrice = totalPrice * 1.35;
  const inStock = selectedVariant ? selectedVariant.stock_quantity > 0 : false;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Back Button */}
      <button
        onClick={() => navigate('/products')}
        className="flex items-center space-x-2 text-[#757575] hover:text-[#F85606] text-xs font-semibold transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Storefront</span>
      </button>

      {/* Main Details Showcase (White Surface Container) */}
      <div className="ui-surface p-6 sm:p-8 rounded-sm grid grid-cols-1 lg:grid-cols-2 gap-8 shadow-xs">
        
        {/* Product Image Gallery */}
        <div className="space-y-4">
          <div className="w-full h-80 sm:h-96 bg-white rounded-sm overflow-hidden flex items-center justify-center border border-gray-200 relative">
            {product.images?.[0]?.image_url ? (
              <img src={product.images[0].image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="text-gray-400 font-mono text-xs">NO IMAGE PREVIEW</div>
            )}

            <span className="absolute top-2 left-2 px-2 py-1 bg-[#F85606] text-white text-xs font-extrabold uppercase rounded-xs">
              -26% OFF
            </span>
          </div>

          <div className="flex items-center space-x-4 p-3 bg-[#E7FFFD]/40 rounded-xs border border-[#b2f5f0] text-xs text-[#0f766e]">
            <ShieldCheck className="w-5 h-5 flex-shrink-0 text-[#F85606]" />
            <span>100% Authentic Product • 7 Days Return Warranty</span>
          </div>
        </div>

        {/* Product Meta & Actions */}
        <div className="space-y-6">
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-xs bg-[#E7FFFD] text-[#0f766e] border border-[#b2f5f0] text-[11px] font-bold uppercase tracking-wider">
              {product.category?.name || 'General Catalog'}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-[#212121] mt-2">{product.name}</h1>
            <p className="text-xs text-[#757575] mt-2 leading-relaxed">
              {product.description || 'No detailed product description available for this item.'}
            </p>
          </div>

          {/* Pricing Card */}
          <div className="p-4 rounded-sm bg-[#EFF0F5]/60 border border-gray-200 space-y-1">
            <div className="flex items-baseline space-x-3">
              <span className="text-3xl font-black text-[#F85606]">
                Rs. {totalPrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </span>
              <span className="text-sm text-[#9E9E9E] line-through">
                Rs. {strikePrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs font-bold text-[#F85606] bg-[#FFE8DE] px-1.5 py-0.5 rounded-xs">
                -26%
              </span>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded-xs text-[11px] font-bold uppercase border ${
                inStock ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {inStock ? `${selectedVariant?.stock_quantity} ITEMS IN STOCK` : 'OUT OF STOCK'}
              </span>
              <span className="text-[11px] text-[#757575] flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-[#F85606]" /> Standard Delivery: 2-4 Days
              </span>
            </div>
          </div>

          {/* Variant Selector */}
          {product.variants?.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#212121] uppercase tracking-wider">Available Variants</label>
              <div className="grid grid-cols-2 gap-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    className={`p-2.5 rounded-sm text-left border text-xs transition-all ${
                      selectedVariant?.id === variant.id
                        ? 'bg-[#FFE8DE] border-[#F85606] text-[#F85606] font-bold'
                        : 'bg-white border-gray-200 text-[#212121] hover:border-gray-400'
                    }`}
                  >
                    <div className="font-mono font-semibold">SKU: {variant.sku}</div>
                    <div className="text-[11px] text-[#757575] mt-0.5">
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
              className="flex-1 py-3 px-4 bg-[#E7FFFD] text-[#0f766e] hover:bg-[#d0fbf9] border border-[#b2f5f0] font-bold text-sm rounded-xs flex items-center justify-center space-x-2 transition-colors disabled:opacity-40"
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
              className="flex-1 py-3 px-4 bg-[#F85606] hover:bg-[#D04400] text-white font-bold text-sm rounded-xs flex items-center justify-center space-x-2 shadow-xs transition-colors disabled:opacity-40"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Buy Now</span>
            </button>
          </div>
        </div>

      </div>

      {/* Customer Reviews Section */}
      <div className="ui-surface p-6 rounded-sm space-y-6 shadow-xs">
        <h3 className="text-lg font-bold text-[#212121] flex items-center space-x-2 border-b border-gray-200 pb-3">
          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          <span>Ratings & Reviews ({reviews.length})</span>
        </h3>

        {/* Submit Review Form */}
        {user ? (
          <form onSubmit={handleReviewSubmit} className="p-4 rounded-sm bg-[#EFF0F5]/50 border border-gray-200 space-y-3">
            <h4 className="text-xs font-bold text-[#212121] uppercase tracking-wider">Leave a Review</h4>
            
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-0.5"
                >
                  <Star className={`w-5 h-5 ${star <= rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>

            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this product..."
              className="w-full p-3 bg-white border border-gray-300 rounded-xs text-xs text-[#212121] placeholder-gray-400 focus:outline-none focus:border-[#F85606]"
            />

            <button
              type="submit"
              disabled={submittingReview}
              className="btn-primary text-xs py-2 px-4"
            >
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        ) : (
          <p className="text-xs text-[#757575] italic">Please sign in to post a review.</p>
        )}

        {/* Reviews List */}
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <p className="text-[#757575] text-xs">No reviews submitted yet.</p>
          ) : (
            reviews.map((rev) => (
              <div key={rev.id} className="p-3 rounded-xs border border-gray-200 space-y-1 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${s <= rev.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-xs font-semibold">
                    Verified Buyer
                  </span>
                </div>
                <p className="text-xs text-[#212121] mt-1">{rev.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
