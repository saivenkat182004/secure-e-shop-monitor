import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, ShoppingCart, Plus, Minus, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Navbar from '@/components/Navbar';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  stock: number;
}

interface Variant {
  id: string;
  variant_type: string;
  variant_value: string;
  price_adjustment: number;
  stock: number;
}

interface Review {
  id: string;
  user_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
}

interface CompetitorPrice {
  id: string;
  competitor_name: string;
  competitor_price: number;
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [competitors, setCompetitors] = useState<CompetitorPrice[]>([]);
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);

  const [newRating, setNewRating] = useState(5);
  const [newReview, setNewReview] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (id) fetchAll();
  }, [id]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [prodRes, varRes, revRes, compRes] = await Promise.all([
        supabase.from('products').select('*').eq('id', id!).single(),
        supabase.from('product_variants').select('*').eq('product_id', id!),
        supabase.from('product_reviews').select('*').eq('product_id', id!).order('created_at', { ascending: false }),
        supabase.from('competitor_prices').select('*').eq('product_id', id!),
      ]);

      if (prodRes.data) {
        setProduct(prodRes.data);
        // Fetch category-based recommendations
        const { data: recData } = await supabase
          .from('products')
          .select('*')
          .eq('category', prodRes.data.category)
          .neq('id', id!)
          .limit(4);
        setRecommended(recData || []);
      }

      setVariants(varRes.data || []);
      setReviews(revRes.data || []);
      setCompetitors(compRes.data || []);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const variantGroups = variants.reduce<Record<string, Variant[]>>((acc, v) => {
    if (!acc[v.variant_type]) acc[v.variant_type] = [];
    acc[v.variant_type].push(v);
    return acc;
  }, {});

  const priceAdjustment = Object.values(selectedVariants).reduce((sum, variantId) => {
    const variant = variants.find(v => v.id === variantId);
    return sum + (variant?.price_adjustment || 0);
  }, 0);

  const finalPrice = (product?.price || 0) + priceAdjustment;

  const handleAddToCart = () => {
    if (!product) return;
    const variantLabel = Object.entries(selectedVariants)
      .map(([type, vid]) => {
        const v = variants.find(vr => vr.id === vid);
        return v ? `${type}: ${v.variant_value}` : '';
      })
      .filter(Boolean)
      .join(', ');

    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: variantLabel ? `${product.id}-${Object.values(selectedVariants).join('-')}` : product.id,
        name: variantLabel ? `${product.name} (${variantLabel})` : product.name,
        price: finalPrice,
        image_url: product.image_url || '/placeholder.svg',
      });
    }
    toast.success(`${product.name} added to cart!`);
  };

  const handleSubmitReview = async () => {
    if (!user || !id) {
      toast.error('Please sign in to leave a review');
      return;
    }
    if (!newReview.trim()) {
      toast.error('Please write a review');
      return;
    }
    setSubmittingReview(true);
    try {
      const { error } = await supabase.from('product_reviews').insert({
        product_id: id,
        user_id: user.id,
        rating: newRating,
        review_text: newReview.trim(),
      });
      if (error) throw error;
      toast.success('Review submitted!');
      setNewReview('');
      setNewRating(5);
      fetchAll();
    } catch (error) {
      toast.error('Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : 'N/A';

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-card rounded w-1/3" />
            <div className="h-96 bg-card rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container mx-auto px-4 text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Product not found</h2>
          <Link to="/products"><Button>Back to Products</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-12 container mx-auto px-4">
        {/* Back button */}
        <Link to="/products" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </Link>

        {/* Product Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
          {/* Image */}
          <div className="aspect-square rounded-xl overflow-hidden bg-card border border-border/50">
            <img src={product.image_url || '/placeholder.svg'} alt={product.name} className="w-full h-full object-cover" />
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <span className="px-3 py-1 text-xs font-medium bg-primary/20 text-primary rounded-full">{product.category}</span>
              <h1 className="font-display text-3xl md:text-4xl font-bold mt-3">{product.name}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span className="font-semibold">{avgRating}</span>
                <span className="text-muted-foreground">({reviews.length} reviews)</span>
              </div>
            </div>

            <p className="text-muted-foreground text-lg">{product.description}</p>

            {/* Variants */}
            {Object.entries(variantGroups).map(([type, vars]) => (
              <div key={type}>
                <h3 className="font-semibold mb-2 capitalize">{type}</h3>
                <div className="flex flex-wrap gap-2">
                  {vars.map(v => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariants(prev => ({ ...prev, [type]: v.id }))}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                        selectedVariants[type] === v.id
                          ? 'border-primary bg-primary/20 text-primary'
                          : 'border-border hover:border-primary/50 text-foreground'
                      }`}
                    >
                      {v.variant_value}
                      {v.price_adjustment !== 0 && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          {v.price_adjustment > 0 ? '+' : ''}₹{v.price_adjustment.toFixed(0)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Price & Add to Cart */}
            <div className="flex items-end gap-6">
              <div>
                <span className="text-4xl font-bold text-primary">₹{finalPrice.toFixed(2)}</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-10 text-center font-medium">{quantity}</span>
                <Button variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Button onClick={handleAddToCart} disabled={product.stock === 0} size="lg" className="w-full glow-primary">
              <ShoppingCart className="w-5 h-5 mr-2" /> Add to Cart
            </Button>
          </div>
        </div>

        {/* Price Comparison */}
        {competitors.length > 0 && (
          <div className="mb-16">
            <h2 className="font-display text-2xl font-bold mb-6">
              <span className="gradient-text">Price Comparison</span>
            </h2>
            <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Platform</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Price</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Difference</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50 bg-primary/5">
                    <td className="py-3 px-4 font-semibold text-primary">TechVolt (You)</td>
                    <td className="py-3 px-4 text-right font-bold text-primary">₹{finalPrice.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right">—</td>
                  </tr>
                  {competitors.map(c => {
                    const diff = c.competitor_price - finalPrice;
                    return (
                      <tr key={c.id} className="border-b border-border/50">
                        <td className="py-3 px-4">{c.competitor_name}</td>
                        <td className="py-3 px-4 text-right font-medium">₹{c.competitor_price.toFixed(2)}</td>
                        <td className={`py-3 px-4 text-right font-medium ${diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                          {diff > 0 ? `+₹${diff.toFixed(2)}` : diff < 0 ? `-₹${Math.abs(diff).toFixed(2)}` : 'Same'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="mb-16">
          <h2 className="font-display text-2xl font-bold mb-6">
            <span className="gradient-text">Customer Reviews</span>
          </h2>

          {/* Write review */}
          {user ? (
            <div className="bg-card rounded-xl border border-border/50 p-6 mb-6">
              <h3 className="font-semibold mb-3">Write a Review</h3>
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} onClick={() => setNewRating(star)}>
                    <Star className={`w-6 h-6 ${star <= newRating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                  </button>
                ))}
              </div>
              <Textarea
                placeholder="Share your experience..."
                value={newReview}
                onChange={e => setNewReview(e.target.value)}
                className="mb-3"
                maxLength={500}
              />
              <Button onClick={handleSubmitReview} disabled={submittingReview} size="sm">
                <Send className="w-4 h-4 mr-2" /> Submit Review
              </Button>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border/50 p-6 mb-6 text-center">
              <p className="text-muted-foreground mb-3">Sign in to leave a review</p>
              <Link to="/auth"><Button size="sm">Sign In</Button></Link>
            </div>
          )}

          {/* Review list */}
          <div className="space-y-4">
            {reviews.map(r => (
              <div key={r.id} className="bg-card rounded-xl border border-border/50 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-4 h-4 ${s <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
                {r.review_text && <p className="text-foreground">{r.review_text}</p>}
              </div>
            ))}
            {reviews.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No reviews yet. Be the first!</p>
            )}
          </div>
        </div>

        {/* Recommendations */}
        {recommended.length > 0 && (
          <div>
            <h2 className="font-display text-2xl font-bold mb-6">
              <span className="gradient-text">You May Also Like</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommended.map(p => (
                <Link key={p.id} to={`/product/${p.id}`} className="group">
                  <div className="bg-card rounded-xl overflow-hidden border border-border/50 hover:border-primary/50 transition-all">
                    <div className="aspect-square overflow-hidden bg-secondary/50">
                      <img src={p.image_url || '/placeholder.svg'} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-display font-semibold line-clamp-1">{p.name}</h3>
                      <span className="text-primary font-bold">₹{p.price.toFixed(2)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
