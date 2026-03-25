import { useState } from "react";
import { useListProjects, useCreateProject } from "@workspace/api-client-react";
import { Plus, Search, Folder, Calendar } from "lucide-react";
import { Link } from "wouter";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";

const projectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  genre: z.string().optional(),
  status: z.enum(["planning", "in_progress", "completed", "archived"]).default("planning"),
});

export default function Projects() {
  const { data: projects = [], isLoading } = useListProjects();
  const createMutation = useCreateProject();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");

  const form = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: { status: "planning" }
  });

  const onSubmit = async (values: z.infer<typeof projectSchema>) => {
    await createMutation.mutateAsync({ data: values });
    queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    setIsDialogOpen(false);
    form.reset();
  };

  const filtered = projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Projects</h1>
          <p className="text-muted-foreground mt-1">Manage your albums, EPs, and major studio works.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <button className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl shadow-neon hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-all flex items-center gap-2">
              <Plus className="h-5 w-5" /> New Project
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card border-border shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-display">Create New Project</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Project Name</label>
                <input 
                  {...form.register("name")} 
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                  placeholder="e.g. Midnight EP"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Genre</label>
                <input 
                  {...form.register("genre")} 
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                  placeholder="e.g. Synthwave"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea 
                  {...form.register("description")} 
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none transition-all min-h-[100px] resize-y"
                  placeholder="Brief description of the concept..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Initial Status</label>
                <select 
                  {...form.register("status")} 
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                >
                  <option value="planning">Planning</option>
                  <option value="in_progress">In Progress</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsDialogOpen(false)} className="px-4 py-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={createMutation.isPending} className="px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-lg shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {createMutation.isPending ? "Creating..." : "Create Project"}
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
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-secondary/50 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 glass-panel rounded-3xl border-dashed">
          <Folder className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-bold mb-2">No projects found</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">You haven't created any projects yet, or none match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(project => (
            <Link key={project.id} href={`/projects/${project.id}`} className="group block h-full">
              <div className="glass-panel p-6 rounded-2xl h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 relative overflow-hidden">
                {/* Decorative background glow on hover */}
                <div className="absolute -right-20 -top-20 w-40 h-40 bg-primary/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center border border-border shadow-sm group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    {project.coverImageUrl ? (
                      <img src={project.coverImageUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <Folder className="h-6 w-6" />
                    )}
                  </div>
                  <StatusBadge status={project.status} />
                </div>
                
                <h3 className="text-xl font-display font-bold text-foreground group-hover:text-primary transition-colors mb-2 relative z-10">{project.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 flex-1 mb-4 relative z-10">
                  {project.description || "No description provided."}
                </p>
                
                <div className="pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground relative z-10">
                  <span className="bg-secondary px-2 py-1 rounded-md">{project.genre || "Unspecified"}</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(project.createdAt), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
