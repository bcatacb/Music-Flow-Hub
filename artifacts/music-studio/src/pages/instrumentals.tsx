import { useState } from "react";
import { useListInstrumentals, useCreateInstrumental, useUpdateInstrumental, useDeleteInstrumental, useListProjects } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Piano, Trash2, Pencil, Music2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";

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

export default function Instrumentals() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: instrumentals = [], isLoading } = useListInstrumentals();
  const { data: projects = [] } = useListProjects();
  const createMutation = useCreateInstrumental();
  const updateMutation = useUpdateInstrumental();
  const deleteMutation = useDeleteInstrumental();

  const { register, handleSubmit, reset, setValue, watch, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: { status: "available", licenseType: "", projectId: "" }
  });

  const openCreate = () => {
    setEditing(null);
    reset({ title: "", producer: "", bpm: "", musicalKey: "", genre: "", mood: "", durationSeconds: "", fileUrl: "", licenseType: "", status: "available", notes: "", projectId: "" });
    setOpen(true);
  };

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
    setOpen(true);
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
    if (editing) {
      await updateMutation.mutateAsync({ instrumentalId: editing.id, data: payload });
    } else {
      await createMutation.mutateAsync({ data: payload });
    }
    setOpen(false);
    queryClient.invalidateQueries();
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this instrumental?")) {
      await deleteMutation.mutateAsync({ instrumentalId: id });
      queryClient.invalidateQueries();
    }
  };

  const formatDuration = (secs?: number | null) => {
    if (!secs) return null;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Instrumentals</h1>
          <p className="text-muted-foreground mt-1">Manage your beats and instrumental tracks</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Add Instrumental
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-48 rounded-xl bg-card animate-pulse" />)}
        </div>
      ) : instrumentals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Piano className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-semibold text-muted-foreground">No instrumentals yet</h3>
          <p className="text-sm text-muted-foreground/70 mt-1 mb-4">Add your first beat or track</p>
          <Button onClick={openCreate} variant="outline">Add Instrumental</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {instrumentals.map((inst: any) => (
            <Card key={inst.id} className="group relative overflow-hidden border border-border hover:border-primary/30 transition-all duration-200">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{inst.title}</CardTitle>
                    {inst.producer && <p className="text-sm text-muted-foreground mt-0.5">by {inst.producer}</p>}
                  </div>
                  <Badge className={`text-xs border shrink-0 ${statusColors[inst.status]}`}>
                    {inst.status.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-3">
                  {inst.bpm && (
                    <Badge variant="secondary" className="text-xs">{inst.bpm} BPM</Badge>
                  )}
                  {inst.musicalKey && (
                    <Badge variant="secondary" className="text-xs">{inst.musicalKey}</Badge>
                  )}
                  {inst.genre && (
                    <Badge variant="outline" className="text-xs">{inst.genre}</Badge>
                  )}
                  {inst.mood && (
                    <Badge variant="outline" className="text-xs">{inst.mood}</Badge>
                  )}
                  {inst.licenseType && (
                    <Badge variant="outline" className="text-xs capitalize">{inst.licenseType.replace("_", " ")}</Badge>
                  )}
                </div>
                {formatDuration(inst.durationSeconds) && (
                  <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                    <Music2 className="h-3 w-3" /> {formatDuration(inst.durationSeconds)}
                  </p>
                )}
                {inst.notes && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{inst.notes}</p>
                )}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="outline" className="gap-1 flex-1" onClick={() => openEdit(inst)}>
                    <Pencil className="h-3 w-3" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(inst.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Instrumental" : "New Instrumental"}</DialogTitle>
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
                <Select value={watch("projectId")} onValueChange={v => setValue("projectId", v)}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {projects.map((p: any) => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>BPM</Label>
                <Input {...register("bpm")} type="number" placeholder="140" />
              </div>
              <div className="space-y-1">
                <Label>Key</Label>
                <Select value={watch("musicalKey")} onValueChange={v => setValue("musicalKey", v)}>
                  <SelectTrigger><SelectValue placeholder="Select key" /></SelectTrigger>
                  <SelectContent>{KEYS.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
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
                <Select value={watch("licenseType")} onValueChange={v => setValue("licenseType", v)}>
                  <SelectTrigger><SelectValue placeholder="Select license" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {LICENSE_TYPES.map(l => <SelectItem key={l} value={l}>{l.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={watch("status")} onValueChange={v => setValue("status", v)}>
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
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{editing ? "Save Changes" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
