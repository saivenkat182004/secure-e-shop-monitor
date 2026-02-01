import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Activity, Clock, Download, Shield, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  encrypted_password_hash: string;
  created_at: string;
}

interface UserSession {
  id: string;
  user_id: string;
  login_time: string;
  logout_time: string | null;
  is_active: boolean;
  user_agent: string | null;
}

interface UserActivity {
  id: string;
  user_id: string;
  action_type: string;
  action_details: unknown;
  page_visited: string | null;
  created_at: string;
}

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (user) {
      checkAdminStatus();
    }
  }, [user, authLoading, navigate]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      setIsAdmin(!!data);
      
      // For demo purposes, allow viewing own data if not admin
      fetchData(!!data);
    } catch (error) {
      console.error('Error checking admin status:', error);
      fetchData(false);
    }
  };

  const fetchData = async (adminAccess: boolean) => {
    if (!user) return;
    
    try {
      // Fetch profiles - admin sees all, users see only their own
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch sessions
      const { data: sessionData } = await supabase
        .from('user_sessions')
        .select('*')
        .order('login_time', { ascending: false });

      // Fetch activities
      const { data: activityData } = await supabase
        .from('user_activity')
        .select('*')
        .order('created_at', { ascending: false });

      setProfiles(profileData || []);
      setSessions(sessionData || []);
      setActivities(activityData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data: object[], filename: string) => {
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = (row as Record<string, unknown>)[header];
          const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
          return `"${stringValue.replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success(`${filename} exported successfully!`);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-12">
          <div className="container mx-auto px-4 text-center">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold gradient-text flex items-center gap-3">
                <Shield className="w-8 h-8" />
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">
                {isAdmin ? 'Full admin access' : 'Viewing your own data'}
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-card border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Users
                </CardTitle>
                <Users className="w-5 h-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{profiles.length}</div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Sessions
                </CardTitle>
                <LogIn className="w-5 h-5 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {sessions.filter(s => s.is_active).length}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Activities
                </CardTitle>
                <Activity className="w-5 h-5 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{activities.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* User Profiles Table */}
          <Card className="bg-card border-border/50 mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Credentials (Encrypted)
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV(profiles, 'user_credentials')}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
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
                    {profiles.map((profile) => (
                      <tr key={profile.id} className="border-b border-border/50">
                        <td className="py-3 px-4">{profile.email}</td>
                        <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                          {profile.encrypted_password_hash.substring(0, 20)}...
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {new Date(profile.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {profiles.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">No user data yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Login Sessions Table */}
          <Card className="bg-card border-border/50 mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Login Sessions
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV(sessions, 'login_sessions')}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
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
                    {sessions.map((session) => (
                      <tr key={session.id} className="border-b border-border/50">
                        <td className="py-3 px-4 font-mono text-xs">{session.user_id.substring(0, 8)}...</td>
                        <td className="py-3 px-4">
                          {new Date(session.login_time).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {session.logout_time 
                            ? new Date(session.logout_time).toLocaleString()
                            : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            session.is_active 
                              ? 'bg-success/20 text-success' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {session.is_active ? 'Active' : 'Ended'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {sessions.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">No session data yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* User Activity Table */}
          <Card className="bg-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display flex items-center gap-2">
                <Activity className="w-5 h-5" />
                User Activity Log
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV(activities, 'user_activity')}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
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
                    {activities.map((activity) => (
                      <tr key={activity.id} className="border-b border-border/50">
                        <td className="py-3 px-4 text-sm">
                          {new Date(activity.created_at).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs">{activity.user_id.substring(0, 8)}...</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-medium">
                            {activity.action_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {activity.page_visited || '-'}
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground max-w-xs truncate">
                          {activity.action_details ? JSON.stringify(activity.action_details) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {activities.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">No activity data yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Admin;
