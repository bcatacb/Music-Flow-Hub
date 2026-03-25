import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { color: string, label: string }> = {
  // Common
  draft: { color: "bg-gray-500/20 text-gray-400 border-gray-500/30", label: "Draft" },
  in_progress: { color: "bg-blue-500/20 text-blue-400 border-blue-500/30", label: "In Progress" },
  complete: { color: "bg-green-500/20 text-green-400 border-green-500/30", label: "Complete" },
  archived: { color: "bg-zinc-700/30 text-zinc-400 border-zinc-600/50", label: "Archived" },
  
  // Projects & Releases
  planning: { color: "bg-purple-500/20 text-purple-400 border-purple-500/30", label: "Planning" },
  completed: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", label: "Completed" },
  pre_release: { color: "bg-orange-500/20 text-orange-400 border-orange-500/30", label: "Pre-Release" },
  released: { color: "bg-primary/20 text-primary border-primary/30", label: "Released" },
  cancelled: { color: "bg-red-500/20 text-red-400 border-red-500/30", label: "Cancelled" },

  // Instrumentals
  available: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", label: "Available" },
  in_use: { color: "bg-blue-500/20 text-blue-400 border-blue-500/30", label: "In Use" },
  
  // Songs
  idea: { color: "bg-slate-500/20 text-slate-400 border-slate-500/30", label: "Idea" },
  writing: { color: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30", label: "Writing" },
  recording: { color: "bg-rose-500/20 text-rose-400 border-rose-500/30", label: "Recording" },
  mixing: { color: "bg-amber-500/20 text-amber-400 border-amber-500/30", label: "Mixing" },
  mastering: { color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30", label: "Mastering" },
  ready: { color: "bg-green-500/20 text-green-400 border-green-500/30", label: "Ready" },
};

export function StatusBadge({ status, className }: { status: string, className?: string }) {
  const config = STATUS_CONFIG[status.toLowerCase()] || { color: "bg-gray-500/20 text-gray-400", label: status };
  
  return (
    <span className={cn(
      "px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm shadow-sm inline-flex items-center",
      config.color,
      className
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70"></span>
      {config.label}
    </span>
  );
}
