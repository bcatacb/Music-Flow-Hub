import { useState } from "react";
import { useListSongs, useCreateSong, useListProjects, useListLyrics, useListInstrumentals } from "@workspace/api-client-react";
import { Plus, Search, Music, PlayCircle, Clock } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";

const songSchema = z.object({
  title: z.string().min(1, "Title is required"),
  projectId: z.coerce.number().optional().nullable(),
  lyricId: z.coerce.number().optional().nullable(),
  instrumentalId: z.coerce.number().optional().nullable(),
  genre: z.string().optional(),
  status: z.enum(["idea", "writing", "recording", "mixing", "mastering", "ready", "released"]).default("idea"),
});

export default function Songs() {
  const { data: songs = [], isLoading } = useListSongs();
  const { data: projects = [] } = useListProjects();
  const { data: lyrics = [] } = useListLyrics();
  const { data: instrumentals = [] } = useListInstrumentals();
  
  const createMutation = useCreateSong();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");

  const form = useForm<z.infer<typeof songSchema>>({
    resolver: zodResolver(songSchema),
    defaultValues: { status: "idea" }
  });

  const onSubmit = async (values: z.infer<typeof songSchema>) => {
    // Convert empty strings/NaN to null/undefined for API
    const data = {
      ...values,
      projectId: values.projectId || undefined,
      lyricId: values.lyricId || undefined,
      instrumentalId: values.instrumentalId || undefined,
    };
    await createMutation.mutateAsync({ data });
    queryClient.invalidateQueries({ queryKey: ["/api/songs"] });
    setIsDialogOpen(false);
    form.reset();
  };

  const filtered = Array.isArray(songs) ? songs.filter(s => s.title.toLowerCase().includes(search.toLowerCase())) : [];

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return "--:--";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Songs</h1>
          <p className="text-muted-foreground mt-1">Combine lyrics and instrumentals into finished tracks.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <button className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl shadow-neon hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-all flex items-center gap-2">
              <Plus className="h-5 w-5" /> Assemble Song
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-card border-border shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-display">Assemble New Song</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Song Title</label>
                <input 
                  {...form.register("title")} 
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                  placeholder="Final track name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">Link Lyric (Optional)</label>
                  <select 
                    {...form.register("lyricId")} 
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                  >
                    <option value="">-- None --</option>
                    {Array.isArray(lyrics) && lyrics.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-blue-400">Link Beat (Optional)</label>
                  <select 
                    {...form.register("instrumentalId")} 
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all"
                  >
                    <option value="">-- None --</option>
                    {Array.isArray(instrumentals) && instrumentals.map(i => <option key={i.id} value={i.id}>{i.title}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project (Optional)</label>
                  <select 
                    {...form.register("projectId")} 
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                  >
                    <option value="">-- Standalone --</option>
                    {Array.isArray(projects) && projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <select 
                    {...form.register("status")} 
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                  >
                    <option value="idea">Idea</option>
                    <option value="writing">Writing</option>
                    <option value="recording">Recording</option>
                    <option value="mixing">Mixing</option>
                    <option value="mastering">Mastering</option>
                    <option value="ready">Ready</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsDialogOpen(false)} className="px-4 py-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={createMutation.isPending} className="px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-lg shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {createMutation.isPending ? "Creating..." : "Create Song"}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input 
          type="text"
          placeholder="Search songs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Track</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Components</th>
                <th className="px-6 py-4 font-medium text-right"><Clock className="inline h-4 w-4" /></th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1,2,3,4].map(i => (
                  <tr key={i} className="border-b border-border/50 animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-secondary w-32 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-secondary w-20 rounded-full"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-secondary w-24 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-secondary w-10 ml-auto rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-8 bg-secondary w-8 ml-auto rounded-lg"></div></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <Music className="h-10 w-10 mx-auto opacity-20 mb-3" />
                    No songs found. Create one to get started.
                  </td>
                </tr>
              ) : (
                filtered.map((song) => (
                  <tr key={song.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center relative overflow-hidden group-hover:shadow-md transition-all">
                          {song.coverImageUrl ? (
                            <img src={song.coverImageUrl} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <img src={`${import.meta.env.BASE_URL}images/album-placeholder.png`} className="w-full h-full object-cover opacity-50" alt="" />
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <PlayCircle className="text-white h-5 w-5" />
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{song.title}</div>
                          <div className="text-xs text-muted-foreground">{song.artistName || "Unknown Artist"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={song.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 text-xs">
                        {song.lyricId ? (
                           <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">Lyric</span>
                        ) : (
                           <span className="px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border">No Lyric</span>
                        )}
                        {song.instrumentalId ? (
                           <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">Beat</span>
                        ) : (
                           <span className="px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border">No Beat</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-muted-foreground font-mono">
                      {formatDuration(song.durationSeconds)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors border border-border hover:border-transparent">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
