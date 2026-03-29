import { useState } from "react";
import { useGetAnalyticsSummary, useListAnalytics, useCreateAnalyticsEntry, useListSongs } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, BarChart3, TrendingUp, Download, Heart, Music } from "lucide-react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type FormValues = {
  songId: string;
  platform: string;
  streams: string;
  downloads: string;
  likes: string;
  recordedDate: string;
};

const PLATFORMS = ["Spotify", "Apple Music", "Tidal", "YouTube Music", "Amazon Music", "SoundCloud", "Deezer", "Other"];

export default function Analytics() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: summary = [], isLoading: summaryLoading } = useGetAnalyticsSummary();
  const { data: songs = [] } = useListSongs();
  const createMutation = useCreateAnalyticsEntry();

  const { register, handleSubmit, reset, setValue, watch, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: { platform: "Spotify", streams: "0", downloads: "0", likes: "0" }
  });

  const onSubmit = async (values: FormValues) => {
    await createMutation.mutateAsync({
      data: {
        songId: parseInt(values.songId),
        platform: values.platform,
        streams: parseInt(values.streams) || 0,
        downloads: parseInt(values.downloads) || 0,
        likes: parseInt(values.likes) || 0,
        recordedDate: values.recordedDate,
      }
    });
    setOpen(false);
    queryClient.invalidateQueries();
  };

  const totalStreams = Array.isArray(summary) ? summary.reduce((sum: number, s: any) => sum + (s.totalStreams || 0), 0) : 0;
  const totalDownloads = Array.isArray(summary) ? summary.reduce((sum: number, s: any) => sum + (s.totalDownloads || 0), 0) : 0;
  const totalLikes = Array.isArray(summary) ? summary.reduce((sum: number, s: any) => sum + (s.totalLikes || 0), 0) : 0;

  const chartData = Array.isArray(summary) ? summary.map((s: any) => ({
    name: s.songTitle?.length > 15 ? s.songTitle.slice(0, 15) + "…" : s.songTitle,
    Streams: s.totalStreams || 0,
    Downloads: s.totalDownloads || 0,
    Likes: s.totalLikes || 0,
  })) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">Track performance across platforms</p>
        </div>
        <Button onClick={() => { reset({ platform: "Spotify", streams: "0", downloads: "0", likes: "0", songId: "", recordedDate: "" }); setOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Log Data
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalStreams.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Streams</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Download className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalDownloads.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Downloads</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-pink-500/10">
                <Heart className="h-5 w-5 text-pink-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalLikes.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Likes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {summary.length > 0 && (
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Performance by Song
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Legend />
                <Bar dataKey="Streams" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Downloads" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Likes" fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Summary Table */}
      {summaryLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-card animate-pulse" />)}
        </div>
      ) : summary.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <BarChart3 className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-semibold text-muted-foreground">No analytics yet</h3>
          <p className="text-sm text-muted-foreground/70 mt-1 mb-4">Log your first data entry</p>
          <Button onClick={() => setOpen(true)} variant="outline">Log Data</Button>
        </div>
      ) : (
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Music className="h-4 w-4 text-primary" />
              Song Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.isArray(summary) && summary.map((s: any) => (
                <div key={s.songId} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <p className="font-medium text-sm">{s.songTitle}</p>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-primary" />{(s.totalStreams || 0).toLocaleString()}</span>
                    <span className="flex items-center gap-1"><Download className="h-3 w-3 text-blue-400" />{(s.totalDownloads || 0).toLocaleString()}</span>
                    <span className="flex items-center gap-1"><Heart className="h-3 w-3 text-pink-400" />{(s.totalLikes || 0).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Log Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Analytics Data</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label>Song *</Label>
              <Select value={watch("songId")} onValueChange={v => setValue("songId", v)}>
                <SelectTrigger><SelectValue placeholder="Select song" /></SelectTrigger>
                <SelectContent>{Array.isArray(songs) && songs.map((s: any) => <SelectItem key={s.id} value={s.id.toString()}>{s.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Platform</Label>
              <Select value={watch("platform")} onValueChange={v => setValue("platform", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Date *</Label>
              <Input {...register("recordedDate", { required: true })} type="date" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Streams</Label>
                <Input {...register("streams")} type="number" min="0" />
              </div>
              <div className="space-y-1">
                <Label>Downloads</Label>
                <Input {...register("downloads")} type="number" min="0" />
              </div>
              <div className="space-y-1">
                <Label>Likes</Label>
                <Input {...register("likes")} type="number" min="0" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Log Data</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
