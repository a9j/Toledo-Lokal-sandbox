import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Building2, 
  Calendar, 
  Tag, 
  Star, 
  MessageSquare,
  TrendingUp,
  Heart,
  Bookmark
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export function AnalyticsDashboard() {
  // User stats
  const { data: userCount } = useQuery({
    queryKey: ['admin-stats-users'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  // Business stats
  const { data: businessStats } = useQuery({
    queryKey: ['admin-stats-businesses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('status, featured');
      if (error) throw error;
      
      const total = data.length;
      const approved = data.filter(b => b.status === 'approved').length;
      const pending = data.filter(b => b.status === 'pending').length;
      const featured = data.filter(b => b.featured).length;
      
      return { total, approved, pending, featured };
    },
  });

  // Event stats
  const { data: eventStats } = useQuery({
    queryKey: ['admin-stats-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('status, start_date_time');
      if (error) throw error;
      
      const now = new Date().toISOString();
      const total = data.length;
      const approved = data.filter(e => e.status === 'approved').length;
      const upcoming = data.filter(e => e.status === 'approved' && e.start_date_time > now).length;
      
      return { total, approved, upcoming };
    },
  });

  // Deal stats
  const { data: dealStats } = useQuery({
    queryKey: ['admin-stats-deals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select('status, end_date');
      if (error) throw error;
      
      const now = new Date().toISOString();
      const total = data.length;
      const active = data.filter(d => d.status === 'approved' && d.end_date > now).length;
      
      return { total, active };
    },
  });

  // Review stats
  const { data: reviewStats } = useQuery({
    queryKey: ['admin-stats-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('rating');
      if (error) throw error;
      
      const total = data.length;
      const avgRating = total > 0 
        ? (data.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1)
        : 0;
      
      return { total, avgRating };
    },
  });

  // Saved items stats
  const { data: savedStats } = useQuery({
    queryKey: ['admin-stats-saved'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_items')
        .select('item_type');
      if (error) throw error;
      
      const total = data.length;
      const byType = data.reduce((acc, item) => {
        acc[item.item_type] = (acc[item.item_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      return { total, byType };
    },
  });

  // Activity over time (last 7 days)
  const { data: activityData } = useQuery({
    queryKey: ['admin-stats-activity'],
    queryFn: async () => {
      const days = 7;
      const startDate = subDays(new Date(), days).toISOString();
      
      const [businesses, events, reviews, posts] = await Promise.all([
        supabase.from('businesses').select('created_at').gte('created_at', startDate),
        supabase.from('events').select('created_at').gte('created_at', startDate),
        supabase.from('reviews').select('created_at').gte('created_at', startDate),
        supabase.from('posts').select('created_at').gte('created_at', startDate),
      ]);

      const dailyData: Record<string, { date: string; businesses: number; events: number; reviews: number; posts: number }> = {};
      
      for (let i = 0; i < days; i++) {
        const date = format(subDays(new Date(), i), 'MMM d');
        dailyData[date] = { date, businesses: 0, events: 0, reviews: 0, posts: 0 };
      }

      businesses.data?.forEach(item => {
        const date = format(new Date(item.created_at), 'MMM d');
        if (dailyData[date]) dailyData[date].businesses++;
      });

      events.data?.forEach(item => {
        const date = format(new Date(item.created_at), 'MMM d');
        if (dailyData[date]) dailyData[date].events++;
      });

      reviews.data?.forEach(item => {
        const date = format(new Date(item.created_at), 'MMM d');
        if (dailyData[date]) dailyData[date].reviews++;
      });

      posts.data?.forEach(item => {
        const date = format(new Date(item.created_at), 'MMM d');
        if (dailyData[date]) dailyData[date].posts++;
      });

      return Object.values(dailyData).reverse();
    },
  });

  // Category distribution
  const { data: categoryData } = useQuery({
    queryKey: ['admin-stats-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('category:categories(name)')
        .eq('status', 'approved');
      if (error) throw error;

      const counts: Record<string, number> = {};
      data.forEach(b => {
        const name = b.category?.name || 'Uncategorized';
        counts[name] = (counts[name] || 0) + 1;
      });

      return Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
    },
  });

  const statCards = [
    { title: 'Total Users', value: userCount || 0, icon: Users, color: 'text-blue-500' },
    { title: 'Businesses', value: businessStats?.approved || 0, subtitle: `${businessStats?.pending || 0} pending`, icon: Building2, color: 'text-green-500' },
    { title: 'Active Events', value: eventStats?.upcoming || 0, subtitle: `${eventStats?.total || 0} total`, icon: Calendar, color: 'text-purple-500' },
    { title: 'Active Deals', value: dealStats?.active || 0, subtitle: `${dealStats?.total || 0} total`, icon: Tag, color: 'text-orange-500' },
    { title: 'Reviews', value: reviewStats?.total || 0, subtitle: `${reviewStats?.avgRating}★ avg`, icon: Star, color: 'text-yellow-500' },
    { title: 'Saved Items', value: savedStats?.total || 0, icon: Bookmark, color: 'text-pink-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <span className="text-2xl font-bold">{stat.value}</span>
              </div>
              <p className="text-xs font-medium text-muted-foreground">{stat.title}</p>
              {stat.subtitle && (
                <p className="text-xs text-muted-foreground/70">{stat.subtitle}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Activity (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="posts" 
                    stackId="1" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.6}
                    name="Posts"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="reviews" 
                    stackId="1" 
                    stroke="hsl(var(--secondary))" 
                    fill="hsl(var(--secondary))" 
                    fillOpacity={0.6}
                    name="Reviews"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="events" 
                    stackId="1" 
                    stroke="hsl(var(--accent))" 
                    fill="hsl(var(--accent))" 
                    fillOpacity={0.6}
                    name="Events"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Top Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center">
              {categoryData && categoryData.length > 0 ? (
                <div className="w-full flex items-center gap-4">
                  <ResponsiveContainer width="50%" height={180}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {categoryData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {categoryData.map((cat, index) => (
                      <div key={cat.name} className="flex items-center gap-2 text-xs">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="flex-1 truncate">{cat.name}</span>
                        <span className="font-medium">{cat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center w-full">No data yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Featured Businesses</p>
              <p className="text-xl font-bold">{businessStats?.featured || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Saved Businesses</p>
              <p className="text-xl font-bold">{savedStats?.byType?.business || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Saved Events</p>
              <p className="text-xl font-bold">{savedStats?.byType?.event || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Saved Deals</p>
              <p className="text-xl font-bold">{savedStats?.byType?.deal || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
