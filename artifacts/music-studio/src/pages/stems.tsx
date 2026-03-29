import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useListStems, useListSongs, useDeleteStem, useCreateStem } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Layers,
  Plus,
  Trash2,
  Upload,
  Music2,
  Clock,
  Zap,
  Radio,
  Mic2,
  Piano,
  Drum,
  Guitar,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const STEM_TYPE_LABELS: Record<string, string> = {
  drums: "Drums",
  bass: "Bass",
  vocals: "Vocals",
  lead_vocals: "Lead Vocals",
  backing_vocals: "Backing Vocals",
  guitars: "Guitars",
  keys: "Keys",
  synth: "Synth",
  strings: "Strings",
  brass: "Brass",
  fx: "FX",
  full_mix: "Full Mix",
  instrumental_mix: "Instrumental Mix",
  acapella: "Acapella",
  other: "Other",
};

const STEM_TYPE_COLORS: Record<string, string> = {
  drums: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  bass: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  vocals: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  lead_vocals: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  backing_vocals: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  guitars: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  keys: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  synth: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  strings: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  brass: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  fx: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  full_mix: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  instrumental_mix: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  acapella: "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30",
  other: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

const STEM_TYPE_ICONS: Record<string, React.ReactNode> = {
  drums: <Drum className="w-3.5 h-3.5" />,
  bass: <Music2 className="w-3.5 h-3.5" />,
  vocals: <Mic2 className="w-3.5 h-3.5" />,
  lead_vocals: <Mic2 className="w-3.5 h-3.5" />,
  backing_vocals: <Mic2 className="w-3.5 h-3.5" />,
  guitars: <Guitar className="w-3.5 h-3.5" />,
  keys: <Piano className="w-3.5 h-3.5" />,
  synth: <Zap className="w-3.5 h-3.5" />,
  fx: <Radio className="w-3.5 h-3.5" />,
  full_mix: <Layers className="w-3.5 h-3.5" />,
};

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function StemCard({ stem, onDelete }: { stem: any; onDelete: () => void }) {
  const color = STEM_TYPE_COLORS[stem.stemType] || STEM_TYPE_COLORS.other;
  const icon = STEM_TYPE_ICONS[stem.stemType] || <Music2 className="w-3.5 h-3.5" />;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4 hover:border-zinc-700 transition-colors group"
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${color} flex-shrink-0`}>
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-medium text-white truncate">{stem.name}</div>
        <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
          {stem.songId && <span className="text-violet-400">Song #{stem.songId}</span>}
          {stem.format && <span className="uppercase">{stem.format}</span>}
          {stem.durationSeconds && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(stem.durationSeconds)}
            </span>
          )}
          {stem.bpm && <span>{stem.bpm} BPM</span>}
          {stem.musicalKey && <span>Key: {stem.musicalKey}</span>}
          {stem.sampleRate && <span>{(stem.sampleRate / 1000).toFixed(1)} kHz</span>}
          {stem.bitDepth && <span>{stem.bitDepth}-bit</span>}
          {stem.channels && <span>{stem.channels === 1 ? "Mono" : "Stereo"}</span>}
        </div>
        {stem.notes && <div className="text-xs text-zinc-600 mt-1 truncate">{stem.notes}</div>}
      </div>

      <Badge className={`text-xs px-2 py-0.5 border ${color} flex-shrink-0`}>
        {STEM_TYPE_LABELS[stem.stemType] || stem.stemType}
      </Badge>

      <Button
        variant="ghost"
        size="icon"
        className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 w-8 h-8 transition-all"
        onClick={onDelete}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </motion.div>
  );
}

export default function StemsPage() {
  const queryClient = useQueryClient();
  const [filterSongId, setFilterSongId] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const { data: stemsRaw = [], isLoading } = useListStems({});
  const { data: songs = [] } = useListSongs({});
  const { mutate: deleteStem } = useDeleteStem();
  const { mutate: createStem } = useCreateStem();

  const stems = Array.isArray(stemsRaw) ? stemsRaw : [];

  const filtered = stems.filter((s) => {
    if (filterSongId !== "all" && String(s.songId) !== filterSongId) return false;
    if (filterType !== "all" && s.stemType !== filterType) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const grouped = filtered.reduce<Record<string, any[]>>((acc, stem) => {
    const key = stem.songId ? `Song #${stem.songId}` : "Unassigned";
    if (!acc[key]) acc[key] = [];
    acc[key].push(stem);
    return acc;
  }, {});

  const handleDelete = (id: number) => {
    deleteStem({ stemId: id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["listStems"] }),
    });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-violet-400" />
            Stems
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            {stems.length} stem{stems.length !== 1 ? "s" : ""} across {Object.keys(grouped).length} group{Object.keys(grouped).length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            onClick={() => setShowImport(true)}
          >
            <Upload className="w-4 h-4 mr-1.5" />
            Import Stems
          </Button>
          <Button
            size="sm"
            className="bg-violet-600 hover:bg-violet-500"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Stem
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search stems…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-56 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600"
        />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-44 bg-zinc-900 border-zinc-700 text-zinc-300">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700">
            <SelectItem value="all">All types</SelectItem>
            {Object.entries(STEM_TYPE_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterSongId} onValueChange={setFilterSongId}>
          <SelectTrigger className="w-48 bg-zinc-900 border-zinc-700 text-zinc-300">
            <SelectValue placeholder="All songs" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700">
            <SelectItem value="all">All songs</SelectItem>
            {Array.isArray(songs) && (songs as any[]).map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>{s.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats strip */}
      {stems.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(
            stems.reduce<Record<string, number>>((acc, s) => {
              acc[s.stemType] = (acc[s.stemType] || 0) + 1;
              return acc;
            }, {})
          )
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => (
              <button
                key={type}
                onClick={() => setFilterType(filterType === type ? "all" : type)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                  filterType === type
                    ? STEM_TYPE_COLORS[type]
                    : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                {STEM_TYPE_LABELS[type]} · {count}
              </button>
            ))}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-20 text-zinc-500">Loading stems…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Layers className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500">No stems yet.</p>
          <p className="text-zinc-600 text-sm mt-1">
            Import your stems from the Import page or add them manually.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <div className="w-6 h-px bg-zinc-700" />
                {group}
                <div className="flex-1 h-px bg-zinc-700" />
                <span className="text-zinc-600">{items.length}</span>
              </div>
              <AnimatePresence>
                <div className="space-y-2">
                  {items.map((stem) => (
                    <StemCard
                      key={stem.id}
                      stem={stem}
                      onDelete={() => handleDelete(stem.id)}
                    />
                  ))}
                </div>
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      {/* Import Dialog */}
      <StemImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        songs={Array.isArray(songs) ? songs : []}
        onDone={() => queryClient.invalidateQueries({ queryKey: ["listStems"] })}
      />

      {/* Create Dialog */}
      <CreateStemDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        songs={Array.isArray(songs) ? songs : []}
        onCreate={(data) => {
          createStem({ data } as any, {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ["listStems"] });
              setShowCreate(false);
            },
          });
        }}
      />
    </div>
  );
}

// ─── Import Dialog ───────────────────────────────────────────────────────────
function StemImportDialog({
  open,
  onClose,
  songs,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  songs: any[];
  onDone: () => void;
}) {
  const [files, setFiles] = useState<FileList | null>(null);
  const [songId, setSongId] = useState<string>("none");
  const [stemType, setStemType] = useState("other");
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleImport = async () => {
    if (!files || files.length === 0) return;
    setImporting(true);
    setResults([]);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) formData.append("files", files[i]);
    if (songId !== "none") formData.append("songId", songId);
    formData.append("stemType", stemType);

    try {
      const res = await fetch(`${BASE}/api/import/stems`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setResults(data.items || []);
      onDone();
    } catch (e: any) {
      setResults([{ fileName: "Import", status: "error", message: e.message }]);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-violet-400" />
            Import Stems
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
              dragging ? "border-violet-500 bg-violet-500/5" : "border-zinc-700 hover:border-zinc-600"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              setFiles(e.dataTransfer.files);
            }}
            onClick={() => document.getElementById("stems-file-input")?.click()}
          >
            <input
              id="stems-file-input"
              type="file"
              multiple
              accept=".mp3,.wav,.aiff,.aif,.flac,.m4a,.ogg"
              className="hidden"
              onChange={(e) => setFiles(e.target.files)}
            />
            <Layers className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            {files && files.length > 0 ? (
              <p className="text-violet-400 font-medium">{files.length} file{files.length !== 1 ? "s" : ""} selected</p>
            ) : (
              <>
                <p className="text-zinc-400 text-sm">Drop stem files here or click to browse</p>
                <p className="text-zinc-600 text-xs mt-1">WAV · AIFF · FLAC · MP3 · M4A</p>
              </>
            )}
          </div>

          <p className="text-xs text-zinc-500 -mt-2">
            Stem type is auto-detected from filename (e.g. "Kicks.wav" → Drums, "LeadVox.wav" → Lead Vocals).
            You can override below.
          </p>

          {/* Song assignment */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-zinc-400 text-xs mb-1.5 block">Link to Song</Label>
              <Select value={songId} onValueChange={setSongId}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-300">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="none">None (unassigned)</SelectItem>
                  {Array.isArray(songs) && songs.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-zinc-400 text-xs mb-1.5 block">Default Stem Type</Label>
              <Select value={stemType} onValueChange={setStemType}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  {Object.entries(STEM_TYPE_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            className="w-full bg-violet-600 hover:bg-violet-500"
            disabled={!files || files.length === 0 || importing}
            onClick={handleImport}
          >
            {importing ? "Importing…" : `Import ${files ? files.length : 0} Stem${files && files.length !== 1 ? "s" : ""}`}
          </Button>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {results.map((r, i) => (
                <div key={i} className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
                  r.status === "success" ? "bg-green-500/10 text-green-400" :
                  r.status === "error" ? "bg-red-500/10 text-red-400" :
                  "bg-zinc-800 text-zinc-500"
                }`}>
                  <span className="font-mono truncate flex-1">{r.fileName}</span>
                  <span>{r.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Create Stem Dialog ───────────────────────────────────────────────────────
function CreateStemDialog({
  open,
  onClose,
  songs,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  songs: any[];
  onCreate: (data: any) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    stemType: "other",
    format: "wav",
    songId: "none",
    bpm: "",
    musicalKey: "",
    durationSeconds: "",
    notes: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    const payload: any = {
      name: form.name,
      stemType: form.stemType,
      format: form.format,
      songId: form.songId !== "none" ? parseInt(form.songId) : null,
      bpm: form.bpm ? parseInt(form.bpm) : null,
      musicalKey: form.musicalKey || null,
      durationSeconds: form.durationSeconds ? parseInt(form.durationSeconds) : null,
      notes: form.notes || null,
    };
    onCreate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-violet-400" />
            Add Stem
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <div>
            <Label className="text-zinc-400 text-xs mb-1.5 block">Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Drums, Lead Vocal, Bass"
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-zinc-400 text-xs mb-1.5 block">Stem Type</Label>
              <Select value={form.stemType} onValueChange={(v) => set("stemType", v)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  {Object.entries(STEM_TYPE_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-zinc-400 text-xs mb-1.5 block">Format</Label>
              <Select value={form.format} onValueChange={(v) => set("format", v)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  {["wav", "mp3", "aiff", "flac", "m4a", "ogg", "other"].map((v) => (
                    <SelectItem key={v} value={v}>{v.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-zinc-400 text-xs mb-1.5 block">Link to Song</Label>
            <Select value={form.songId} onValueChange={(v) => set("songId", v)}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-300">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="none">None (unassigned)</SelectItem>
                {songs.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-zinc-400 text-xs mb-1.5 block">BPM</Label>
              <Input value={form.bpm} onChange={(e) => set("bpm", e.target.value)} placeholder="120" className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
            <div>
              <Label className="text-zinc-400 text-xs mb-1.5 block">Key</Label>
              <Input value={form.musicalKey} onChange={(e) => set("musicalKey", e.target.value)} placeholder="Am" className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
            <div>
              <Label className="text-zinc-400 text-xs mb-1.5 block">Duration (s)</Label>
              <Input value={form.durationSeconds} onChange={(e) => set("durationSeconds", e.target.value)} placeholder="180" className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
          </div>

          <div>
            <Label className="text-zinc-400 text-xs mb-1.5 block">Notes</Label>
            <Input value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Optional notes…" className="bg-zinc-800 border-zinc-700 text-white" />
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1 border-zinc-700 text-zinc-400" onClick={onClose}>Cancel</Button>
            <Button
              className="flex-1 bg-violet-600 hover:bg-violet-500"
              disabled={!form.name}
              onClick={handleSubmit}
            >
              Add Stem
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
