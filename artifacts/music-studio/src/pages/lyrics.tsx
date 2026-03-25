import { useState } from "react";
import { useListLyrics, useCreateLyric } from "@workspace/api-client-react";
import { Plus, Search, Mic2, FileText } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";

const lyricSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  status: z.enum(["draft", "in_progress", "complete"]).default("draft"),
  theme: z.string().optional(),
});

export default function Lyrics() {
  const { data: lyrics = [], isLoading } = useListLyrics();
  const createMutation = useCreateLyric();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedLyric, setSelectedLyric] = useState<any>(null); // For viewing content

  const form = useForm<z.infer<typeof lyricSchema>>({
    resolver: zodResolver(lyricSchema),
    defaultValues: { status: "draft" }
  });

  const onSubmit = async (values: z.infer<typeof lyricSchema>) => {
    await createMutation.mutateAsync({ data: values });
    queryClient.invalidateQueries({ queryKey: ["/api/lyrics"] });
    setIsDialogOpen(false);
    form.reset();
  };

  const filtered = lyrics.filter(l => l.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8 pb-12 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-2">
            <Mic2 className="h-8 w-8 text-primary" /> Lyrics Pad
          </h1>
          <p className="text-muted-foreground mt-1">Write, store, and organize your verses and hooks.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <button className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl shadow-neon hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-all flex items-center gap-2">
              <Plus className="h-5 w-5" /> New Lyric
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] bg-card border-border shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-display">Write New Lyric</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <div className="flex gap-4">
                <div className="space-y-2 flex-1">
                  <label className="text-sm font-medium">Title</label>
                  <input 
                    {...form.register("title")} 
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none transition-all font-display font-bold text-lg"
                    placeholder="Song Title / Working Title"
                  />
                </div>
                <div className="space-y-2 w-1/3">
                  <label className="text-sm font-medium">Status</label>
                  <select 
                    {...form.register("status")} 
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none transition-all h-[42px]"
                  >
                    <option value="draft">Draft</option>
                    <option value="in_progress">In Progress</option>
                    <option value="complete">Complete</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Theme/Vibe</label>
                <input 
                  {...form.register("theme")} 
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                  placeholder="e.g. Heartbreak, Hype, Storytelling..."
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Content</label>
                  <span className="text-xs text-muted-foreground">Tip: Add [Chorus], [Verse] tags</span>
                </div>
                <textarea 
                  {...form.register("content")} 
                  className="w-full bg-background border border-border rounded-lg px-4 py-4 focus:ring-2 focus:ring-primary focus:outline-none transition-all min-h-[300px] resize-y font-mono text-sm leading-relaxed"
                  placeholder="[Verse 1]&#10;Write your lines here..."
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setIsDialogOpen(false)} className="px-4 py-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={createMutation.isPending} className="px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-lg shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {createMutation.isPending ? "Saving..." : "Save Lyric"}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md flex-shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input 
          type="text"
          placeholder="Search lyrics by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* List Panel */}
        <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
          {isLoading ? (
            [1,2,3,4].map(i => <div key={i} className="h-24 bg-secondary/50 rounded-xl animate-pulse" />)
          ) : filtered.length === 0 ? (
             <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
               <FileText className="h-8 w-8 mx-auto opacity-20 mb-2" />
               <p>No lyrics found.</p>
             </div>
          ) : (
            filtered.map((lyric) => (
              <div 
                key={lyric.id} 
                onClick={() => setSelectedLyric(lyric)}
                className={`p-4 rounded-xl cursor-pointer transition-all border ${selectedLyric?.id === lyric.id ? 'bg-primary/10 border-primary shadow-[0_0_10px_rgba(var(--primary),0.1)]' : 'glass-panel hover:bg-secondary hover:border-border/80'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-foreground truncate pr-2">{lyric.title}</h4>
                  <StatusBadge status={lyric.status} className="scale-75 origin-top-right -mt-1 -mr-1" />
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 font-mono">
                  {lyric.content || "Empty content..."}
                </p>
                {lyric.theme && (
                  <span className="mt-3 inline-block text-[10px] uppercase tracking-wider bg-secondary text-muted-foreground px-2 py-0.5 rounded">
                    {lyric.theme}
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {/* View/Edit Panel */}
        <div className="hidden md:flex flex-1 glass-panel rounded-2xl p-6 lg:p-8 flex-col overflow-hidden relative">
          {selectedLyric ? (
            <>
              <div className="flex justify-between items-start mb-6 pb-6 border-b border-border flex-shrink-0">
                <div>
                  <h2 className="text-3xl font-display font-bold text-foreground mb-2">{selectedLyric.title}</h2>
                  <div className="flex gap-3 items-center">
                    <StatusBadge status={selectedLyric.status} />
                    {selectedLyric.theme && <span className="text-sm text-primary">• {selectedLyric.theme}</span>}
                  </div>
                </div>
                <button className="px-4 py-2 bg-secondary hover:bg-primary hover:text-primary-foreground text-sm font-medium rounded-lg transition-colors">
                  Edit Full Screen
                </button>
              </div>
              <div className="flex-1 overflow-y-auto whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground/90 pr-4 custom-scrollbar">
                {selectedLyric.content}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <Mic2 className="h-16 w-16 mb-4 opacity-10" />
              <p className="text-lg">Select a lyric from the list to view it.</p>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground)); }
      `}</style>
    </div>
  );
}
