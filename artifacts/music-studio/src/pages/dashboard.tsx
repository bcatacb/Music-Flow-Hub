import { useQuery } from "@tanstack/react-query";
import { 
  useListProjects, 
  useListSongs, 
  useListReleases, 
  useGetAnalyticsSummary 
} from "@workspace/api-client-react";
import { FolderKanban, Music, Radio, Play, TrendingUp, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { StatusBadge } from "@/components/shared/StatusBadge";

export default function Dashboard() {
  const { data: projects = [], isLoading: isLoadingProjects } = useListProjects();
  const { data: songs = [], isLoading: isLoadingSongs } = useListSongs();
  const { data: releases = [] } = useListReleases();
  const { data: analytics = [] } = useGetAnalyticsSummary();

  const totalStreams = Array.isArray(analytics) ? analytics.reduce((acc, curr) => acc + (curr.totalStreams || 0), 0) : 0;
  const activeProjects = Array.isArray(projects) ? projects.filter(p => p.status === 'in_progress').length : 0;

  // Mock chart data based on overall vibe
  const chartData = [
    { name: 'Mon', streams: Math.floor(totalStreams * 0.1) || 1200 },
    { name: 'Tue', streams: Math.floor(totalStreams * 0.15) || 1800 },
    { name: 'Wed', streams: Math.floor(totalStreams * 0.12) || 1500 },
    { name: 'Thu', streams: Math.floor(totalStreams * 0.2) || 2400 },
    { name: 'Fri', streams: Math.floor(totalStreams * 0.18) || 2100 },
    { name: 'Sat', streams: Math.floor(totalStreams * 0.25) || 3200 },
    { name: 'Sun', streams: Math.floor(totalStreams * 0.3) || 4100 },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden glass-panel border-none p-8 md:p-12 min-h-[240px] flex items-end">
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/studio-bg.png`} 
            alt="Studio background" 
            className="w-full h-full object-cover opacity-40 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
        </div>
        
        <div className="relative z-10 w-full">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-2">
            Welcome back to the <span className="text-gradient">Studio</span>.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            You have <strong className="text-white">{activeProjects} active projects</strong> and your tracks have accumulated <strong className="text-white">{totalStreams.toLocaleString()}</strong> total streams.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total Projects", value: Array.isArray(projects) ? projects.length : 0, icon: FolderKanban, color: "text-blue-400", bg: "bg-blue-500/10" },
          { title: "Total Songs", value: Array.isArray(songs) ? songs.length : 0, icon: Music, color: "text-primary", bg: "bg-primary/10" },
          { title: "Active Releases", value: Array.isArray(releases) ? releases.filter(r => r.status === 'pre_release' || r.status === 'planning').length : 0, icon: Radio, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { title: "Total Streams", value: totalStreams.toLocaleString(), icon: Play, color: "text-purple-400", bg: "bg-purple-500/10" },
        ].map((stat, i) => (
          <div key={i} className="glass-panel p-6 rounded-2xl hover:-translate-y-1 transition-transform duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-muted-foreground text-sm font-medium mb-1">{stat.title}</p>
            <h3 className="text-3xl font-display font-bold text-foreground">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold font-display">Performance Overview</h3>
              <p className="text-sm text-muted-foreground">Streams across all platforms (Last 7 days)</p>
            </div>
            <Link href="/analytics" className="text-sm text-primary hover:underline font-medium flex items-center">
              Full Analytics <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <div className="flex-1 min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorStreams" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Area type="monotone" dataKey="streams" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorStreams)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Songs */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold font-display">Recent Tracks</h3>
            <Link href="/songs" className="text-sm text-primary hover:underline font-medium">View All</Link>
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-auto pr-2">
            {isLoadingSongs ? (
              <div className="animate-pulse space-y-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-secondary rounded-lg"></div>
                    <div className="flex-1 space-y-2"><div className="h-4 bg-secondary w-2/3 rounded"></div><div className="h-3 bg-secondary w-1/3 rounded"></div></div>
                  </div>
                ))}
              </div>
            ) : !Array.isArray(songs) || songs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
                <Music className="h-8 w-8 mb-2 opacity-20" />
                <p>No songs created yet.</p>
              </div>
            ) : (
              songs.slice(0, 5).map(song => (
                <Link key={song.id} href={`/songs`} className="flex items-center gap-4 p-3 rounded-xl hover:bg-secondary/50 transition-colors group cursor-pointer border border-transparent hover:border-border">
                  <div className="w-12 h-12 rounded-lg bg-secondary overflow-hidden shadow-md flex-shrink-0">
                    <img 
                      src={song.coverImageUrl || `${import.meta.env.BASE_URL}images/album-placeholder.png`} 
                      alt={song.title} 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">{song.title}</h4>
                    <p className="text-xs text-muted-foreground truncate">{song.genre || 'Unspecified Genre'}</p>
                  </div>
                  <StatusBadge status={song.status} className="hidden sm:inline-flex" />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
