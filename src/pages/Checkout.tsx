import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, CreditCard, Package, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Navbar from '@/components/Navbar';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [address, setAddress] = useState({
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [placing, setPlacing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [stockErrors, setStockErrors] = useState<string[]>([]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-12 container mx-auto px-4 text-center py-20">
          <h2 className="font-display text-2xl font-bold mb-4">Please sign in to checkout</h2>
          <Link to="/auth"><Button>Sign In</Button></Link>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-12 container mx-auto px-4 text-center py-20">
          <h2 className="font-display text-2xl font-bold mb-4">Your cart is empty</h2>
          <Link to="/products"><Button>Browse Products</Button></Link>
        </div>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-12 container mx-auto px-4">
          <div className="max-w-md mx-auto text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-primary" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-4">Order Placed Successfully!</h2>
            <p className="text-muted-foreground mb-2">Your order has been confirmed.</p>
            <p className="text-muted-foreground mb-8">Payment: <span className="font-semibold text-foreground">Cash on Delivery</span></p>
            <Link to="/products">
              <Button className="glow-primary">Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const checkStockAvailability = async (): Promise<boolean> => {
    const errors: string[] = [];
    // Extract base product IDs (remove variant suffixes)
    const productIds = [...new Set(items.map(item => item.id.split('-')[0]))];

    const { data: products } = await supabase
      .from('products')
      .select('id, name, stock')
      .in('id', productIds);

    if (!products) {
      errors.push('Unable to verify stock. Please try again.');
      setStockErrors(errors);
      return false;
    }

    for (const item of items) {
      const baseId = item.id.split('-')[0];
      const product = products.find(p => p.id === baseId);
      if (!product) {
        errors.push(`${item.name} is no longer available.`);
      } else if (product.stock < item.quantity) {
        errors.push(`${item.name}: Only ${product.stock} left in stock (you requested ${item.quantity}).`);
      }
    }

    setStockErrors(errors);
    return errors.length === 0;
  };

  const updateStock = async () => {
    const stockUpdates: Record<string, number> = {};
    for (const item of items) {
      const baseId = item.id.split('-')[0];
      stockUpdates[baseId] = (stockUpdates[baseId] || 0) + item.quantity;
    }

    for (const [productId, qty] of Object.entries(stockUpdates)) {
      await supabase.rpc('deduct_stock', { p_product_id: productId, p_quantity: qty });
    }
  };

  const handlePlaceOrder = async () => {
    if (!address.full_name || !address.phone || !address.address_line1 || !address.city || !address.state || !address.pincode) {
      toast.error('Please fill in all required address fields');
      return;
    }
    if (!/^\d{6}$/.test(address.pincode)) {
      toast.error('Please enter a valid 6-digit pincode');
      return;
    }
    if (!/^\d{10}$/.test(address.phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setPlacing(true);
    try {
      const stockOk = await checkStockAvailability();
      if (!stockOk) {
        setPlacing(false);
        return;
      }

      const { error } = await supabase.from('orders').insert({
        user_id: user.id,
        total_amount: totalPrice,
        payment_method: 'cod',
        shipping_address: address,
        items: items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, image_url: i.image_url })),
      });

      if (error) throw error;

      await updateStock();
      clearCart();
      setOrderPlaced(true);
      toast.success('Order placed successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-12 container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/cart" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Cart
          </Link>

          <h1 className="font-display text-3xl font-bold gradient-text mb-8">Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Address Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card rounded-xl border border-border/50 p-6">
                <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" /> Delivery Address
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name *</Label>
                    <Input value={address.full_name} onChange={e => setAddress(a => ({ ...a, full_name: e.target.value }))} placeholder="John Doe" />
                  </div>
                  <div>
                    <Label>Phone Number *</Label>
                    <Input value={address.phone} onChange={e => setAddress(a => ({ ...a, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))} placeholder="9876543210" />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Address Line 1 *</Label>
                    <Input value={address.address_line1} onChange={e => setAddress(a => ({ ...a, address_line1: e.target.value }))} placeholder="House No., Street, Area" />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Address Line 2</Label>
                    <Input value={address.address_line2} onChange={e => setAddress(a => ({ ...a, address_line2: e.target.value }))} placeholder="Landmark (optional)" />
                  </div>
                  <div>
                    <Label>City *</Label>
                    <Input value={address.city} onChange={e => setAddress(a => ({ ...a, city: e.target.value }))} placeholder="Hyderabad" />
                  </div>
                  <div>
                    <Label>State *</Label>
                    <Input value={address.state} onChange={e => setAddress(a => ({ ...a, state: e.target.value }))} placeholder="Telangana" />
                  </div>
                  <div>
                    <Label>Pincode *</Label>
                    <Input value={address.pincode} onChange={e => setAddress(a => ({ ...a, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))} placeholder="500001" />
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div className="bg-card rounded-xl border border-border/50 p-6">
                <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" /> Payment Method
                </h2>
                <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg border border-primary/30">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Cash on Delivery</p>
                    <p className="text-sm text-muted-foreground">Pay when your order is delivered</p>
                  </div>
                </div>
              </div>

              {/* Stock Errors */}
              {stockErrors.length > 0 && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4">
                  <h3 className="font-semibold text-destructive mb-2">Stock Issues:</h3>
                  <ul className="space-y-1">
                    {stockErrors.map((err, i) => (
                      <li key={i} className="text-sm text-destructive">{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div>
              <div className="bg-card rounded-xl border border-border/50 p-6 sticky top-24">
                <h2 className="font-display text-xl font-bold mb-4">Order Summary</h2>
                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center gap-3">
                      <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <span className="text-sm font-bold">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{totalPrice.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-primary font-medium">Free</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Payment</span>
                    <span>Cash on Delivery</span>
                  </div>
                  <div className="border-t border-border pt-3">
                    <div className="flex justify-between">
                      <span className="font-display text-lg font-bold">Total</span>
                      <span className="font-display text-xl font-bold gradient-text">₹{totalPrice.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handlePlaceOrder}
                  disabled={placing}
                  size="lg"
                  className="w-full mt-6 glow-primary"
                >
                  {placing ? 'Placing Order...' : 'Place Order (COD)'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
