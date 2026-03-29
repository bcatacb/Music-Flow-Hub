import { useState } from "react";
import { useListReleases, useCreateRelease, useUpdateRelease, useDeleteRelease, useListProjects } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Radio, Trash2, Pencil, CalendarDays } from "lucide-react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

type FormValues = {
  title: string;
  releaseType: string;
  status: string;
  releaseDate: string;
  platforms: string;
  distributorName: string;
  upc: string;
  coverImageUrl: string;
  notes: string;
  projectId: string;
};

const RELEASE_TYPES = ["single", "ep", "album", "mixtape"];
const RELEASE_STATUSES = ["planning", "pre_release", "released", "cancelled"];

const statusColors: Record<string, string> = {
  planning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  pre_release: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  released: "bg-green-500/10 text-green-400 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
};

const typeColors: Record<string, string> = {
  single: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  ep: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  album: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  mixtape: "bg-pink-500/10 text-pink-400 border-pink-500/20",
};

export default function Releases() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: releases = [], isLoading } = useListReleases();
  const { data: projects = [] } = useListProjects();
  const createMutation = useCreateRelease();
  const updateMutation = useUpdateRelease();
  const deleteMutation = useDeleteRelease();

  const { register, handleSubmit, reset, setValue, watch, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: { releaseType: "single", status: "planning" }
  });

  const openCreate = () => {
    setEditing(null);
    reset({ title: "", releaseType: "single", status: "planning", releaseDate: "", platforms: "", distributorName: "", upc: "", coverImageUrl: "", notes: "", projectId: "" });
    setOpen(true);
  };

  const openEdit = (r: any) => {
    setEditing(r);
    reset({
      title: r.title,
      releaseType: r.releaseType,
      status: r.status,
      releaseDate: r.releaseDate || "",
      platforms: r.platforms || "",
      distributorName: r.distributorName || "",
      upc: r.upc || "",
      coverImageUrl: r.coverImageUrl || "",
      notes: r.notes || "",
      projectId: r.projectId?.toString() || "",
    });
    setOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    const payload = {
      title: values.title,
      releaseType: values.releaseType as any,
      status: values.status as any,
      releaseDate: values.releaseDate || undefined,
      platforms: values.platforms || undefined,
      distributorName: values.distributorName || undefined,
      upc: values.upc || undefined,
      coverImageUrl: values.coverImageUrl || undefined,
      notes: values.notes || undefined,
      projectId: values.projectId ? parseInt(values.projectId) : undefined,
    };
    if (editing) {
      await updateMutation.mutateAsync({ releaseId: editing.id, data: payload });
    } else {
      await createMutation.mutateAsync({ data: payload });
    }
    setOpen(false);
    queryClient.invalidateQueries();
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this release?")) {
      await deleteMutation.mutateAsync({ releaseId: id });
      queryClient.invalidateQueries();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Releases</h1>
          <p className="text-muted-foreground mt-1">Plan and track your music releases</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> New Release
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-48 rounded-xl bg-card animate-pulse" />)}
        </div>
      ) : Array.isArray(releases) && releases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Radio className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-semibold text-muted-foreground">No releases yet</h3>
          <p className="text-sm text-muted-foreground/70 mt-1 mb-4">Plan your first release</p>
          <Button onClick={openCreate} variant="outline">Create Release</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.isArray(releases) && releases.map((r: any) => (
            <Card key={r.id} className="group overflow-hidden border border-border hover:border-primary/30 transition-all duration-200">
              {r.coverImageUrl && (
                <div className="h-32 overflow-hidden">
                  <img src={r.coverImageUrl} alt={r.title} className="w-full h-full object-cover" />
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{r.title}</CardTitle>
                    {r.distributorName && <p className="text-xs text-muted-foreground mt-0.5">via {r.distributorName}</p>}
                  </div>
                  <Badge className={`text-xs border shrink-0 ${statusColors[r.status]}`}>
                    {r.status.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge className={`text-xs border capitalize ${typeColors[r.releaseType]}`}>{r.releaseType}</Badge>
                  {r.releaseDate && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {format(new Date(r.releaseDate), "MMM d, yyyy")}
                    </Badge>
                  )}
                </div>
                {r.platforms && (
                  <p className="text-xs text-muted-foreground mb-2">Platforms: {r.platforms}</p>
                )}
                {r.upc && (
                  <p className="text-xs text-muted-foreground mb-2 font-mono">UPC: {r.upc}</p>
                )}
                {r.notes && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{r.notes}</p>
                )}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="outline" className="gap-1 flex-1" onClick={() => openEdit(r)}>
                    <Pencil className="h-3 w-3" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(r.id)}>
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
            <DialogTitle>{editing ? "Edit Release" : "New Release"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <Label>Title *</Label>
                <Input {...register("title", { required: true })} placeholder="Release title" />
              </div>
              <div className="space-y-1">
                <Label>Release Type</Label>
                <Select value={watch("releaseType")} onValueChange={v => setValue("releaseType", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{RELEASE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={watch("status")} onValueChange={v => setValue("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{RELEASE_STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Release Date</Label>
                <Input {...register("releaseDate")} type="date" />
              </div>
              <div className="space-y-1">
                <Label>Project</Label>
                <Select value={watch("projectId") || "__none__"} onValueChange={v => setValue("projectId", v === "__none__" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {Array.isArray(projects) && projects.map((p: any) => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Platforms</Label>
                <Input {...register("platforms")} placeholder="Spotify, Apple Music, Tidal..." />
              </div>
              <div className="space-y-1">
                <Label>Distributor</Label>
                <Input {...register("distributorName")} placeholder="DistroKid, TuneCore..." />
              </div>
              <div className="space-y-1">
                <Label>UPC</Label>
                <Input {...register("upc")} placeholder="UPC barcode" />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Cover Image URL</Label>
                <Input {...register("coverImageUrl")} placeholder="https://..." />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Notes</Label>
                <Textarea {...register("notes")} placeholder="Notes about this release..." rows={3} />
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
