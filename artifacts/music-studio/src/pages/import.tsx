import { useState, useRef, useCallback } from "react";
import { useListProjects } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Upload, FolderOpen, Piano, FileText, Music2,
  CheckCircle2, XCircle, AlertCircle, Loader2, Info
} from "lucide-react";
import { cn } from "@/lib/utils";

type ImportStatus = "idle" | "uploading" | "done";
type ResultItem = {
  fileName: string;
  status: "success" | "error" | "skipped";
  message?: string;
  id?: number;
  type: "instrumental" | "lyric" | "song";
};
type ImportResult = {
  total: number;
  succeeded: number;
  failed: number;
  items: ResultItem[];
};

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function postFiles(endpoint: string, files: File[], projectId?: string): Promise<ImportResult> {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  if (projectId) form.append("projectId", projectId);
  const res = await fetch(`${BASE}/api${endpoint}`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Server error: ${res.status}`);
  return res.json();
}

// ─── Drop Zone ───────────────────────────────────────────────────────────────
function DropZone({
  label,
  description,
  accept,
  icon: Icon,
  color,
  onFiles,
  directory,
}: {
  label: string;
  description: string;
  accept: string;
  icon: React.ElementType;
  color: string;
  onFiles: (files: File[]) => void;
  directory?: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) onFiles(files);
    },
    [onFiles]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) onFiles(files);
    e.target.value = "";
  };

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 select-none",
        dragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/50 hover:bg-secondary/30"
      )}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={handleChange}
        {...(directory ? { webkitdirectory: "", directory: "" } as any : {})}
      />
      <div className={cn("inline-flex p-4 rounded-2xl mb-4", color)}>
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="font-bold text-lg mb-1">{label}</h3>
      <p className="text-sm text-muted-foreground mb-3">{description}</p>
      <div className="flex gap-2 justify-center flex-wrap">
        <Button variant="outline" size="sm" className="gap-1 pointer-events-none">
          <Upload className="h-3.5 w-3.5" /> Drop files here
        </Button>
        {directory && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1 pointer-events-none"
          >
            <FolderOpen className="h-3.5 w-3.5" /> or select folder
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Result List ─────────────────────────────────────────────────────────────
function ResultList({ result }: { result: ImportResult }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-3 text-sm font-medium mb-3">
        <span className="flex items-center gap-1 text-green-400">
          <CheckCircle2 className="h-4 w-4" /> {result.succeeded} imported
        </span>
        {result.failed > 0 && (
          <span className="flex items-center gap-1 text-red-400">
            <XCircle className="h-4 w-4" /> {result.failed} failed
          </span>
        )}
        {result.items.filter((i) => i.status === "skipped").length > 0 && (
          <span className="flex items-center gap-1 text-yellow-400">
            <AlertCircle className="h-4 w-4" /> {result.items.filter((i) => i.status === "skipped").length} skipped
          </span>
        )}
      </div>
      <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
        {result.items.map((item, i) => (
          <div
            key={i}
            className={cn(
              "flex items-start gap-2 px-3 py-2 rounded-lg text-sm",
              item.status === "success" && "bg-green-500/5 border border-green-500/20",
              item.status === "error" && "bg-red-500/5 border border-red-500/20",
              item.status === "skipped" && "bg-yellow-500/5 border border-yellow-500/20"
            )}
          >
            {item.status === "success" && <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />}
            {item.status === "error" && <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />}
            {item.status === "skipped" && <AlertCircle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />}
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{item.fileName}</p>
              {item.message && <p className="text-muted-foreground text-xs">{item.message}</p>}
            </div>
            {item.id && (
              <Badge variant="secondary" className="text-xs shrink-0">#{item.id}</Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Import Section ───────────────────────────────────────────────────────────
function ImportSection({
  title,
  description,
  icon: Icon,
  color,
  dropZoneLabel,
  dropZoneDescription,
  accept,
  endpoint,
  projectId,
  directory,
  tips,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  dropZoneLabel: string;
  dropZoneDescription: string;
  accept: string;
  endpoint: string;
  projectId: string;
  directory?: boolean;
  tips: string[];
}) {
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: File[]) => {
    setStatus("uploading");
    setError(null);
    setResult(null);
    try {
      const r = await postFiles(endpoint, files, projectId || undefined);
      setResult(r);
      setStatus("done");
    } catch (err: any) {
      setError(err.message || "Upload failed");
      setStatus("idle");
    }
  };

  return (
    <Card className="border border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-xl", color)}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <DropZone
          label={dropZoneLabel}
          description={dropZoneDescription}
          accept={accept}
          icon={Icon}
          color={color}
          onFiles={handleFiles}
          directory={directory}
        />

        {status === "uploading" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing files, extracting metadata...
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">
            <XCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {result && <ResultList result={result} />}

        {status === "done" && (
          <Button variant="outline" size="sm" onClick={() => { setStatus("idle"); setResult(null); }}>
            Import More
          </Button>
        )}

        {/* Tips */}
        <div className="bg-secondary/30 rounded-xl p-3 space-y-1">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Info className="h-3 w-3" /> Tips
          </p>
          {tips.map((tip, i) => (
            <p key={i} className="text-xs text-muted-foreground">• {tip}</p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Import() {
  const { data: projects = [] } = useListProjects();
  const [projectId, setProjectId] = useState("");

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import</h1>
        <p className="text-muted-foreground mt-1">
          Bulk import your existing beats, lyrics, and Studio One projects into the database
        </p>
      </div>

      {/* Project selector */}
      <div className="flex items-center gap-3 p-4 bg-secondary/20 rounded-2xl border border-border max-w-sm">
        <Label className="shrink-0 text-sm font-medium">Link to project</Label>
        <Select value={projectId || "__none__"} onValueChange={v => setProjectId(v === "__none__" ? "" : v)}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="None (import standalone)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">None</SelectItem>
            {projects.map((p: any) => (
              <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Beats / Instrumentals */}
        <ImportSection
          title="Beats & Instrumentals"
          description="Audio files from your beats folder"
          icon={Piano}
          color="bg-violet-500/10 text-violet-400"
          dropZoneLabel="Drop audio files or select your beats folder"
          dropZoneDescription="MP3, WAV, AIFF, FLAC, M4A, OGG"
          accept=".mp3,.wav,.aiff,.aif,.flac,.m4a,.ogg,.wma,audio/*"
          endpoint="/import/instrumentals"
          projectId={projectId}
          directory
          tips={[
            "Select your entire beats folder — all audio files will be scanned",
            "ID3 tags (BPM, key, artist) are read automatically",
            "Title is taken from the ID3 tag or file name if not set",
            "You can edit any record after import to add more metadata",
          ]}
        />

        {/* Lyrics */}
        <ImportSection
          title="Lyrics"
          description="Text files from your lyrics folder"
          icon={FileText}
          color="bg-blue-500/10 text-blue-400"
          dropZoneLabel="Drop lyric files or select your lyrics folder"
          dropZoneDescription="TXT, LRC, or Markdown files"
          accept=".txt,.lrc,.md,.markdown"
          endpoint="/import/lyrics"
          projectId={projectId}
          directory
          tips={[
            "Select your entire lyrics folder — all .txt files will be imported",
            "The file name (without extension) becomes the lyric title",
            "The full text content becomes the lyrics body",
            "Status is set to 'Draft' so you can review before finalizing",
          ]}
        />

        {/* Studio One */}
        <ImportSection
          title="Studio One Projects"
          description="Import .song files from Studio One"
          icon={Music2}
          color="bg-orange-500/10 text-orange-400"
          dropZoneLabel="Drop your Studio One .song files"
          dropZoneDescription=".song project files from Studio One"
          accept=".song"
          endpoint="/import/studio-one"
          projectId={projectId}
          tips={[
            "Studio One .song files are ZIP archives — we extract metadata from them",
            "Tempo, key signature, and track name are read automatically",
            "Each .song file creates one Song record (status: Idea)",
            "You can then link lyrics and instrumentals to each imported song",
            "If Studio One can't read certain metadata, the file name is used as title",
          ]}
        />
      </div>

      {/* Instructions panel */}
      <Card className="border border-border bg-secondary/10">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            How to export from Studio One
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Your <strong className="text-foreground">.song</strong> files can be imported directly — no export needed.
            Just navigate to your Studio One projects folder (usually in <code className="bg-secondary px-1 py-0.5 rounded text-xs">Documents/Studio One/Songs/</code>)
            and drag the <strong className="text-foreground">.song</strong> files here.
          </p>
          <p>
            We extract the following automatically: <strong className="text-foreground">song name, tempo (BPM), key signature, and artist name</strong>.
            You can then link beats and lyrics to each imported song from the <strong className="text-foreground">Songs</strong> page.
          </p>
          <p>
            For audio stems or mixdowns, export them from Studio One as <strong className="text-foreground">WAV or MP3</strong> and import them
            as instrumentals using the Beats section above.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
