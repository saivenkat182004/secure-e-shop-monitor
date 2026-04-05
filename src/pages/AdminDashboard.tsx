import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Activity, Clock, Download, Shield, Plus, Trash2, Package, X, LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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

const AdminDashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '', description: '', price: '', category: '', image_url: '', stock: '0',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/admin-login');
    } else if (user) {
      checkAdmin();
    }
  }, [user, authLoading]);

  const checkAdmin = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!data) {
      toast.error('Access denied. Admin only.');
      navigate('/');
      return;
    }
    setIsAdmin(true);
    fetchData();
  };

  const fetchData = async () => {
    try {
      const [productRes, orderRes, profileRes, sessionRes, activityRes] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('user_sessions').select('*').order('login_time', { ascending: false }),
        supabase.from('user_activity').select('*').order('created_at', { ascending: false }),
      ]);
      setProducts(productRes.data || []);
      setOrders(orderRes.data || []);
      setProfiles(profileRes.data || []);
      setSessions(sessionRes.data || []);
      setActivities(activityRes.data || []);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.category) {
      toast.error('Name, price, and category are required');
      return;
    }
    try {
      const { error } = await supabase.from('products').insert({
        name: newProduct.name,
        description: newProduct.description || null,
        price: parseFloat(newProduct.price),
        category: newProduct.category,
        image_url: newProduct.image_url || null,
        stock: parseInt(newProduct.stock) || 0,
      });
      if (error) throw error;
      toast.success('Product added!');
      setShowAddProduct(false);
      setNewProduct({ name: '', description: '', price: '', category: '', image_url: '', stock: '0' });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add product');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
      toast.success('Product deleted');
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  const exportToExcel = (data: object[], filename: string) => {
    if (data.length === 0) { toast.error('No data to export'); return; }
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = (row as Record<string, unknown>)[header];
          const str = typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
          return `"${str.replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success(`${filename} exported!`);
  };

  const exportOrdersToExcel = () => {
    if (orders.length === 0) { toast.error('No orders'); return; }
    const rows: object[] = [];
    for (const order of orders) {
      const items = order.items as any[];
      const orderedDate = new Date(order.created_at).toLocaleDateString('en-IN');
      const deliveryDate = new Date(new Date(order.created_at).getTime() + 7 * 86400000).toLocaleDateString('en-IN');
      for (const item of items) {
        rows.push({
          'Order ID': order.id.substring(0, 8).toUpperCase(),
          'Product Name': item.name,
          'Quantity': item.quantity,
          'Ordered Date': orderedDate,
          'Delivery Date': deliveryDate,
        });
      }
    }
    exportToExcel(rows, 'orders_report');
  };

  const handleAdminLogout = async () => {
    await signOut();
    navigate('/admin-login');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading admin dashboard...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <div className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <span className="font-display text-xl font-bold gradient-text">TechVolt Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={handleAdminLogout}>
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Users', value: profiles.length, icon: Users },
            { label: 'Active Sessions', value: sessions.filter(s => s.is_active).length, icon: LogIn },
            { label: 'Activities', value: activities.length, icon: Activity },
            { label: 'Products', value: products.length, icon: Package },
            { label: 'Orders', value: orders.length, icon: Package },
          ].map(s => (
            <Card key={s.label} className="bg-card border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                <s.icon className="w-5 h-5 text-primary" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{s.value}</div></CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-card">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card className="bg-card border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-display flex items-center gap-2">
                  <Package className="w-5 h-5" /> Manage Products
                </CardTitle>
                <Button onClick={() => setShowAddProduct(!showAddProduct)} size="sm">
                  {showAddProduct ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  {showAddProduct ? 'Cancel' : 'Add Product'}
                </Button>
              </CardHeader>
              <CardContent>
                {showAddProduct && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-secondary/50 rounded-lg">
                    <div><Label>Product Name *</Label><Input value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} placeholder="Product name" /></div>
                    <div><Label>Category *</Label><Input value={newProduct.category} onChange={e => setNewProduct(p => ({ ...p, category: e.target.value }))} placeholder="e.g., Smartphones" /></div>
                    <div><Label>Price (₹) *</Label><Input type="number" value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))} placeholder="29999" /></div>
                    <div><Label>Stock</Label><Input type="number" value={newProduct.stock} onChange={e => setNewProduct(p => ({ ...p, stock: e.target.value }))} placeholder="0" /></div>
                    <div><Label>Image URL</Label><Input value={newProduct.image_url} onChange={e => setNewProduct(p => ({ ...p, image_url: e.target.value }))} placeholder="https://..." /></div>
                    <div className="md:col-span-2"><Label>Description</Label><Textarea value={newProduct.description} onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))} placeholder="Product description..." /></div>
                    <div className="md:col-span-2"><Button onClick={handleAddProduct} className="glow-primary"><Plus className="w-4 h-4 mr-2" /> Add Product</Button></div>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Name</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Category</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Price</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Stock</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p.id} className="border-b border-border/50">
                          <td className="py-3 px-4 font-medium">{p.name}</td>
                          <td className="py-3 px-4 text-muted-foreground">{p.category}</td>
                          <td className="py-3 px-4 text-primary font-bold">₹{p.price.toFixed(2)}</td>
                          <td className="py-3 px-4">{p.stock}</td>
                          <td className="py-3 px-4">
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(p.id)} className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {products.length === 0 && <p className="text-center py-8 text-muted-foreground">No products yet</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card className="bg-card border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-display flex items-center gap-2"><Package className="w-5 h-5" /> Order History</CardTitle>
                <Button variant="outline" size="sm" onClick={exportOrdersToExcel}><Download className="w-4 h-4 mr-2" /> Export to Excel</Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Order ID</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Product Name</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Quantity</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Ordered Date</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Delivery Date</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => {
                        const items = order.items as any[];
                        const orderedDate = new Date(order.created_at).toLocaleDateString('en-IN');
                        const deliveryDate = new Date(new Date(order.created_at).getTime() + 7 * 86400000).toLocaleDateString('en-IN');
                        return items.map((item: any, idx: number) => (
                          <tr key={`${order.id}-${idx}`} className="border-b border-border/50">
                            <td className="py-3 px-4 font-mono text-xs">{order.id.substring(0, 8).toUpperCase()}</td>
                            <td className="py-3 px-4 font-medium">{item.name}</td>
                            <td className="py-3 px-4">{item.quantity}</td>
                            <td className="py-3 px-4">{orderedDate}</td>
                            <td className="py-3 px-4">{deliveryDate}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === 'pending' ? 'bg-yellow-400/20 text-yellow-400' : 'bg-green-400/20 text-green-400'}`}>
                                {order.status}
                              </span>
                            </td>
                          </tr>
                        ));
                      })}
                    </tbody>
                  </table>
                  {orders.length === 0 && <p className="text-center py-8 text-muted-foreground">No orders yet</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="bg-card border-border/50">
              <CardHeader><CardTitle className="font-display flex items-center gap-2"><Users className="w-5 h-5" /> User Credentials (Encrypted)</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Email</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Password Hash</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Created At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profiles.map(profile => (
                        <tr key={profile.id} className="border-b border-border/50">
                          <td className="py-3 px-4">{profile.email}</td>
                          <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{profile.encrypted_password_hash.substring(0, 20)}...</td>
                          <td className="py-3 px-4 text-muted-foreground">{new Date(profile.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {profiles.length === 0 && <p className="text-center py-8 text-muted-foreground">No user data</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions">
            <Card className="bg-card border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-display flex items-center gap-2"><Clock className="w-5 h-5" /> Login Sessions</CardTitle>
                <Button variant="outline" size="sm" onClick={() => exportToExcel(sessions, 'login_sessions')}><Download className="w-4 h-4 mr-2" /> Export</Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">User ID</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Login Time</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Logout Time</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map(session => (
                        <tr key={session.id} className="border-b border-border/50">
                          <td className="py-3 px-4 font-mono text-xs">{session.user_id.substring(0, 8)}...</td>
                          <td className="py-3 px-4">{new Date(session.login_time).toLocaleString()}</td>
                          <td className="py-3 px-4 text-muted-foreground">{session.logout_time ? new Date(session.logout_time).toLocaleString() : '-'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${session.is_active ? 'bg-green-400/20 text-green-400' : 'bg-muted text-muted-foreground'}`}>
                              {session.is_active ? 'Active' : 'Ended'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {sessions.length === 0 && <p className="text-center py-8 text-muted-foreground">No session data</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card className="bg-card border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-display flex items-center gap-2"><Activity className="w-5 h-5" /> User Activity Log</CardTitle>
                <Button variant="outline" size="sm" onClick={() => exportToExcel(activities, 'user_activity')}><Download className="w-4 h-4 mr-2" /> Export</Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Time</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">User ID</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Action</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Page</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activities.map(activity => (
                        <tr key={activity.id} className="border-b border-border/50">
                          <td className="py-3 px-4 text-sm">{new Date(activity.created_at).toLocaleString()}</td>
                          <td className="py-3 px-4 font-mono text-xs">{activity.user_id.substring(0, 8)}...</td>
                          <td className="py-3 px-4"><span className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-medium">{activity.action_type}</span></td>
                          <td className="py-3 px-4 text-muted-foreground">{activity.page_visited || '-'}</td>
                          <td className="py-3 px-4 text-xs text-muted-foreground max-w-xs truncate">{activity.action_details ? JSON.stringify(activity.action_details) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {activities.length === 0 && <p className="text-center py-8 text-muted-foreground">No activity data</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
