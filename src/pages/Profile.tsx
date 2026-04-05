import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ShoppingBag, Clock, Mail, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (user) {
      fetchUserData();
    }
  }, [user, authLoading]);

  const fetchUserData = async () => {
    if (!user) return;
    try {
      const [orderRes, sessionRes] = await Promise.all([
        supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('user_sessions').select('*').eq('user_id', user.id).order('login_time', { ascending: false }).limit(10),
      ]);
      setOrders(orderRes.data || []);
      setSessions(sessionRes.data || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-12 text-center"><div className="animate-pulse text-muted-foreground">Loading...</div></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Profile Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold gradient-text">My Profile</h1>
              <p className="text-muted-foreground flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4" /> {user?.email}
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Member since {new Date(user?.created_at || '').toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-card border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
                <ShoppingBag className="w-5 h-5 text-primary" />
              </CardHeader>
              <CardContent><div className="text-3xl font-bold">{orders.length}</div></CardContent>
            </Card>
            <Card className="bg-card border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
                <ShoppingBag className="w-5 h-5 text-accent" />
              </CardHeader>
              <CardContent><div className="text-3xl font-bold">₹{orders.reduce((sum, o) => sum + Number(o.total_amount), 0).toLocaleString('en-IN')}</div></CardContent>
            </Card>
            <Card className="bg-card border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Login Sessions</CardTitle>
                <Clock className="w-5 h-5 text-primary" />
              </CardHeader>
              <CardContent><div className="text-3xl font-bold">{sessions.length}</div></CardContent>
            </Card>
          </div>

          <Tabs defaultValue="orders" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-card">
              <TabsTrigger value="orders">My Orders</TabsTrigger>
              <TabsTrigger value="sessions">Login History</TabsTrigger>
            </TabsList>

            {/* Orders */}
            <TabsContent value="orders">
              <Card className="bg-card border-border/50">
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2"><ShoppingBag className="w-5 h-5" /> Order History</CardTitle>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No orders yet. Start shopping!</p>
                  ) : (
                    <div className="space-y-4">
                      {orders.map(order => {
                        const items = order.items as any[];
                        const orderedDate = new Date(order.created_at).toLocaleDateString('en-IN');
                        const deliveryDate = new Date(new Date(order.created_at).getTime() + 7 * 86400000).toLocaleDateString('en-IN');
                        return (
                          <div key={order.id} className="border border-border/50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <p className="font-mono text-xs text-muted-foreground">Order #{order.id.substring(0, 8).toUpperCase()}</p>
                                <p className="text-sm text-muted-foreground">Ordered: {orderedDate} • Delivery: {deliveryDate}</p>
                              </div>
                              <div className="text-right">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === 'pending' ? 'bg-yellow-400/20 text-yellow-400' : 'bg-green-400/20 text-green-400'}`}>
                                  {order.status}
                                </span>
                                <p className="text-primary font-bold mt-1">₹{Number(order.total_amount).toLocaleString('en-IN')}</p>
                              </div>
                            </div>
                            <div className="space-y-1">
                              {items.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between text-sm">
                                  <span>{item.name} × {item.quantity}</span>
                                  <span className="text-muted-foreground">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sessions */}
            <TabsContent value="sessions">
              <Card className="bg-card border-border/50">
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2"><Clock className="w-5 h-5" /> Recent Login Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-muted-foreground font-medium">Login Time</th>
                          <th className="text-left py-3 px-4 text-muted-foreground font-medium">Logout Time</th>
                          <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessions.map(session => (
                          <tr key={session.id} className="border-b border-border/50">
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
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Profile;
