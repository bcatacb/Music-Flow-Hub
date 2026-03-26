import { useState } from "react";
import { useListInstrumentals, useUpdateInstrumental, useDeleteInstrumental, useListProjects } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Piano, Trash2, Pencil, Music2, Upload, Clock, Zap, Disc } from "lucide-react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";

type FormValues = {
  title: string;
  producer: string;
  bpm: string;
  musicalKey: string;
  genre: string;
  mood: string;
  durationSeconds: string;
  fileUrl: string;
  licenseType: string;
  status: string;
  notes: string;
  projectId: string;
};

const LICENSE_TYPES = ["exclusive", "non_exclusive", "lease", "free"];
const STATUSES = ["available", "in_use", "archived"];
const KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "Cm", "C#m", "Dm", "D#m", "Em", "Fm", "F#m", "Gm", "G#m", "Am", "A#m", "Bm"];

const statusColors: Record<string, string> = {
  available: "bg-green-500/10 text-green-400 border-green-500/20",
  in_use: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  archived: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

function formatDuration(secs?: number | null) {
  if (!secs) return null;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function Instrumentals() {
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: instrumentals = [], isLoading } = useListInstrumentals();
  const { data: projects = [] } = useListProjects();
  const updateMutation = useUpdateInstrumental();
  const deleteMutation = useDeleteInstrumental();

  const { register, handleSubmit, reset, setValue, watch, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: { status: "available", licenseType: "", projectId: "" }
  });

  const openEdit = (inst: any) => {
    setEditing(inst);
    reset({
      title: inst.title,
      producer: inst.producer || "",
      bpm: inst.bpm?.toString() || "",
      musicalKey: inst.musicalKey || "",
      genre: inst.genre || "",
      mood: inst.mood || "",
      durationSeconds: inst.durationSeconds?.toString() || "",
      fileUrl: inst.fileUrl || "",
      licenseType: inst.licenseType || "",
      status: inst.status,
      notes: inst.notes || "",
      projectId: inst.projectId?.toString() || "",
    });
    setEditOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    const payload = {
      title: values.title,
      producer: values.producer || undefined,
      bpm: values.bpm ? parseInt(values.bpm) : undefined,
      musicalKey: values.musicalKey || undefined,
      genre: values.genre || undefined,
      mood: values.mood || undefined,
      durationSeconds: values.durationSeconds ? parseInt(values.durationSeconds) : undefined,
      fileUrl: values.fileUrl || undefined,
      licenseType: (values.licenseType || undefined) as any,
      status: values.status as any,
      notes: values.notes || undefined,
      projectId: values.projectId ? parseInt(values.projectId) : undefined,
    };
    await updateMutation.mutateAsync({ instrumentalId: editing.id, data: payload });
    setEditOpen(false);
    queryClient.invalidateQueries({ queryKey: ["/api/instrumentals"] });
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this beat?")) {
      await deleteMutation.mutateAsync({ instrumentalId: id });
      queryClient.invalidateQueries({ queryKey: ["/api/instrumentals"] });
    }
  };

  const filtered = (instrumentals as any[]).filter((i) =>
    !search || i.title.toLowerCase().includes(search.toLowerCase()) ||
    (i.producer && i.producer.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Beats</h1>
          <p className="text-muted-foreground mt-1">
            {(instrumentals as any[]).length} beat{(instrumentals as any[]).length !== 1 ? "s" : ""} in your library
          </p>
        </div>
        <Link href="/import">
          <Button className="gap-2 bg-violet-600 hover:bg-violet-500">
            <Upload className="h-4 w-4" /> Import Beats
          </Button>
        </Link>
      </div>

      {/* Search */}
      {(instrumentals as any[]).length > 0 && (
        <Input
          placeholder="Search beats by title or producer…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600"
        />
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-48 rounded-xl bg-card animate-pulse" />)}
        </div>
      ) : filtered.length === 0 && (instrumentals as any[]).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-5">
            <Piano className="h-10 w-10 text-violet-400" />
          </div>
          <h3 className="text-xl font-semibold">No beats yet</h3>
          <p className="text-muted-foreground mt-2 max-w-sm text-sm">
            Import your beats folder and we'll extract BPM, key, duration, and producer name automatically from the audio files.
          </p>
          <Link href="/import">
            <Button className="mt-6 gap-2 bg-violet-600 hover:bg-violet-500">
              <Upload className="h-4 w-4" /> Import Your Beats
            </Button>
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          No beats match "<span className="text-white">{search}</span>"
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((inst: any) => (
            <Card key={inst.id} className="group relative overflow-hidden border border-border hover:border-primary/30 transition-all duration-200">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{inst.title}</CardTitle>
                    {inst.producer && (
                      <p className="text-sm text-muted-foreground mt-0.5">by {inst.producer}</p>
                    )}
                  </div>
                  <Badge className={`text-xs border shrink-0 ${statusColors[inst.status] || statusColors.available}`}>
                    {inst.status?.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Metadata row */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mb-3">
                  {inst.bpm && (
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-violet-400" />{inst.bpm} BPM
                    </span>
                  )}
                  {inst.musicalKey && (
                    <span className="flex items-center gap-1">
                      <Disc className="h-3 w-3 text-blue-400" />{inst.musicalKey}
                    </span>
                  )}
                  {formatDuration(inst.durationSeconds) && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />{formatDuration(inst.durationSeconds)}
                    </span>
                  )}
                  {inst.genre && (
                    <span className="flex items-center gap-1">
                      <Music2 className="h-3 w-3" />{inst.genre}
                    </span>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {inst.mood && <Badge variant="outline" className="text-xs">{inst.mood}</Badge>}
                  {inst.licenseType && (
                    <Badge variant="outline" className="text-xs capitalize">{inst.licenseType.replace("_", " ")}</Badge>
                  )}
                </div>

                {inst.notes && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{inst.notes}</p>
                )}

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="outline" className="gap-1 flex-1" onClick={() => openEdit(inst)}>
                    <Pencil className="h-3 w-3" /> Edit Metadata
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(inst.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Beat — {editing?.title}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <Label>Title *</Label>
                <Input {...register("title", { required: true })} placeholder="Beat name" />
              </div>
              <div className="space-y-1">
                <Label>Producer</Label>
                <Input {...register("producer")} placeholder="Producer name" />
              </div>
              <div className="space-y-1">
                <Label>Project</Label>
                <Select value={watch("projectId") || "__none__"} onValueChange={v => setValue("projectId", v === "__none__" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {(projects as any[]).map((p: any) => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>BPM</Label>
                <Input {...register("bpm")} type="number" placeholder="140" />
              </div>
              <div className="space-y-1">
                <Label>Key</Label>
                <Select value={watch("musicalKey") || "__none__"} onValueChange={v => setValue("musicalKey", v === "__none__" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Select key" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {KEYS.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Genre</Label>
                <Input {...register("genre")} placeholder="Hip-Hop, Trap, R&B..." />
              </div>
              <div className="space-y-1">
                <Label>Mood</Label>
                <Input {...register("mood")} placeholder="Dark, Uplifting, Chill..." />
              </div>
              <div className="space-y-1">
                <Label>Duration (seconds)</Label>
                <Input {...register("durationSeconds")} type="number" placeholder="180" />
              </div>
              <div className="space-y-1">
                <Label>License Type</Label>
                <Select value={watch("licenseType") || "__none__"} onValueChange={v => setValue("licenseType", v === "__none__" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Select license" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {LICENSE_TYPES.map(l => <SelectItem key={l} value={l}>{l.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={watch("status") || "available"} onValueChange={v => setValue("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1">
                <Label>File URL</Label>
                <Input {...register("fileUrl")} placeholder="https://..." />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Notes</Label>
                <Textarea {...register("notes")} placeholder="Additional notes..." rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
