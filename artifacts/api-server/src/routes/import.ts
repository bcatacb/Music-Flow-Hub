import { Router, type IRouter } from "express";
import multer from "multer";
import * as mm from "music-metadata";
import JSZip from "jszip";
import { db } from "@workspace/db";
import { instrumentalsTable, lyricsTable, songsTable, stemsTable } from "@workspace/db/schema";

const router: IRouter = Router();

// Store files in memory (buffer) for processing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
});

// ─── Audio file extensions we support ──────────────────────────────────────
const AUDIO_EXTENSIONS = new Set([".mp3", ".wav", ".aiff", ".aif", ".flac", ".m4a", ".ogg", ".wma"]);
const LYRICS_EXTENSIONS = new Set([".txt", ".lrc", ".md"]);
const STUDIO_ONE_EXTENSION = ".song";

function extOf(name: string) {
  const idx = name.lastIndexOf(".");
  return idx === -1 ? "" : name.slice(idx).toLowerCase();
}

function baseName(name: string) {
  const idx = name.lastIndexOf(".");
  return idx === -1 ? name : name.slice(0, idx);
}

// ─── Import Instrumentals (audio files) ────────────────────────────────────
router.post("/import/instrumentals", upload.array("files"), async (req, res) => {
  const files = req.files as Express.Multer.File[];
  const projectId = req.body.projectId ? parseInt(req.body.projectId) : undefined;

  if (!files || files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  const items: any[] = [];
  let succeeded = 0;
  let failed = 0;

  for (const file of files) {
    const ext = extOf(file.originalname);
    if (!AUDIO_EXTENSIONS.has(ext)) {
      items.push({ fileName: file.originalname, status: "skipped", message: `Unsupported format: ${ext}`, type: "instrumental" });
      continue;
    }

    try {
      // Parse metadata from audio buffer
      const metadata = await mm.parseBuffer(file.buffer, { mimeType: file.mimetype });
      const common = metadata.common;
      const format = metadata.format;

      const title = common.title || baseName(file.originalname);
      const bpm = common.bpm ? Math.round(common.bpm) : undefined;
      const durationSeconds = format.duration ? Math.round(format.duration) : undefined;
      const genre = common.genre?.[0] || undefined;
      const key = (common as any).key || undefined;
      const producer = common.artist || common.albumartist || undefined;

      const [instrumental] = await db
        .insert(instrumentalsTable)
        .values({
          title,
          projectId: projectId || null,
          bpm: bpm || null,
          musicalKey: key || null,
          genre: genre || null,
          durationSeconds: durationSeconds || null,
          producer: producer || null,
          status: "available",
          notes: `Imported from ${file.originalname}`,
        })
        .returning();

      items.push({ fileName: file.originalname, status: "success", type: "instrumental", id: instrumental.id, message: `Created: ${title}` });
      succeeded++;
    } catch (err: any) {
      req.log.error({ err, file: file.originalname }, "Failed to import audio file");
      items.push({ fileName: file.originalname, status: "error", type: "instrumental", message: err.message || "Parse error" });
      failed++;
    }
  }

  res.json({ total: files.length, succeeded, failed, items });
});

// ─── Import Lyrics (text files) ────────────────────────────────────────────
router.post("/import/lyrics", upload.array("files"), async (req, res) => {
  const files = req.files as Express.Multer.File[];
  const projectId = req.body.projectId ? parseInt(req.body.projectId) : undefined;

  if (!files || files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  const items: any[] = [];
  let succeeded = 0;
  let failed = 0;

  for (const file of files) {
    const ext = extOf(file.originalname);
    if (!LYRICS_EXTENSIONS.has(ext)) {
      items.push({ fileName: file.originalname, status: "skipped", message: `Unsupported format: ${ext}`, type: "lyric" });
      continue;
    }

    try {
      const content = file.buffer.toString("utf-8");
      const title = baseName(file.originalname);

      const [lyric] = await db
        .insert(lyricsTable)
        .values({
          title,
          content,
          projectId: projectId || null,
          status: "draft",
          notes: `Imported from ${file.originalname}`,
        })
        .returning();

      items.push({ fileName: file.originalname, status: "success", type: "lyric", id: lyric.id, message: `Created: ${title}` });
      succeeded++;
    } catch (err: any) {
      req.log.error({ err, file: file.originalname }, "Failed to import lyric file");
      items.push({ fileName: file.originalname, status: "error", type: "lyric", message: err.message || "Parse error" });
      failed++;
    }
  }

  res.json({ total: files.length, succeeded, failed, items });
});

// ─── Import Studio One .song files ─────────────────────────────────────────
router.post("/import/studio-one", upload.array("files"), async (req, res) => {
  const files = req.files as Express.Multer.File[];
  const projectId = req.body.projectId ? parseInt(req.body.projectId) : undefined;

  if (!files || files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  const items: any[] = [];
  let succeeded = 0;
  let failed = 0;

  for (const file of files) {
    const ext = extOf(file.originalname);
    if (ext !== STUDIO_ONE_EXTENSION) {
      items.push({ fileName: file.originalname, status: "skipped", message: `Not a .song file`, type: "song" });
      continue;
    }

    try {
      // Studio One .song files are ZIP archives
      const zip = await JSZip.loadAsync(file.buffer);

      // Look for the main project XML file (usually Song.xml or a .musicx file)
      let songData: any = null;
      const xmlCandidates = ["Song.xml", "song.xml", "Project.xml", "project.xml"];

      for (const candidate of xmlCandidates) {
        const f = zip.file(candidate);
        if (f) {
          const xmlStr = await f.async("string");
          songData = parseStudioOneSongXml(xmlStr);
          break;
        }
      }

      // If no canonical XML found, try any .xml file at the root
      if (!songData) {
        const xmlFiles = Object.keys(zip.files).filter(
          (name) => name.endsWith(".xml") && !name.includes("/")
        );
        for (const xmlName of xmlFiles) {
          const f = zip.file(xmlName);
          if (f) {
            const xmlStr = await f.async("string");
            const parsed = parseStudioOneSongXml(xmlStr);
            if (parsed) { songData = parsed; break; }
          }
        }
      }

      // Fallback: use filename as song title
      const title = songData?.title || baseName(file.originalname);
      const bpm = songData?.tempo ? Math.round(parseFloat(songData.tempo)) : undefined;
      const musicalKey = songData?.key || undefined;
      const durationSeconds = songData?.duration ? Math.round(parseFloat(songData.duration)) : undefined;
      const genre = songData?.genre || undefined;
      const artistName = songData?.artist || undefined;
      const recordLabel = songData?.label || undefined;

      const [song] = await db
        .insert(songsTable)
        .values({
          title,
          projectId: projectId || null,
          bpm: bpm || null,
          musicalKey: musicalKey || null,
          durationSeconds: durationSeconds || null,
          genre: genre || null,
          artistName: artistName || null,
          recordLabel: recordLabel || null,
          status: "idea",
          notes: `Imported from Studio One: ${file.originalname}`,
        })
        .returning();

      items.push({
        fileName: file.originalname,
        status: "success",
        type: "song",
        id: song.id,
        message: `Created song: ${title}${bpm ? ` @ ${bpm} BPM` : ""}${musicalKey ? `, Key: ${musicalKey}` : ""}`,
      });
      succeeded++;
    } catch (err: any) {
      req.log.error({ err, file: file.originalname }, "Failed to import Studio One file");
      items.push({ fileName: file.originalname, status: "error", type: "song", message: err.message || "Parse error" });
      failed++;
    }
  }

  res.json({ total: files.length, succeeded, failed, items });
});

// ─── Import Stems (audio files linked to a song) ───────────────────────────
router.post("/import/stems", upload.array("files"), async (req, res) => {
  const files = req.files as Express.Multer.File[];
  const songId = req.body.songId ? parseInt(req.body.songId) : undefined;
  const stemType = req.body.stemType || "other";

  if (!files || files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  const items: any[] = [];
  let succeeded = 0;
  let failed = 0;

  for (const file of files) {
    const ext = extOf(file.originalname);
    if (!AUDIO_EXTENSIONS.has(ext)) {
      items.push({ fileName: file.originalname, status: "skipped", message: `Unsupported format: ${ext}`, type: "stem" });
      continue;
    }

    try {
      const metadata = await mm.parseBuffer(file.buffer, { mimeType: file.mimetype });
      const common = metadata.common;
      const fmt = metadata.format;

      const name = common.title || baseName(file.originalname);
      const bpm = common.bpm ? Math.round(common.bpm) : undefined;
      const durationSeconds = fmt.duration ? Math.round(fmt.duration) : undefined;
      const musicalKey = (common as any).key || undefined;
      const sampleRate = fmt.sampleRate ? Math.round(fmt.sampleRate) : undefined;
      const bitDepth = fmt.bitsPerSample || undefined;
      const channels = fmt.numberOfChannels || undefined;

      // Infer format from extension
      const formatMap: Record<string, string> = {
        ".wav": "wav", ".mp3": "mp3", ".aiff": "aiff", ".aif": "aiff",
        ".flac": "flac", ".m4a": "m4a", ".ogg": "ogg",
      };
      const format = formatMap[ext] || "other";

      // Auto-detect stem type from filename if not explicitly provided
      const resolvedType = inferStemType(file.originalname) || stemType;

      const [stem] = await db
        .insert(stemsTable)
        .values({
          name,
          songId: songId || null,
          stemType: resolvedType as any,
          format: format as any,
          bpm: bpm || null,
          musicalKey: musicalKey || null,
          durationSeconds: durationSeconds || null,
          sampleRate: sampleRate || null,
          bitDepth: bitDepth || null,
          channels: channels || null,
          notes: `Imported from ${file.originalname}`,
        })
        .returning();

      items.push({ fileName: file.originalname, status: "success", type: "stem", id: stem.id, message: `Created stem: ${name} (${resolvedType})` });
      succeeded++;
    } catch (err: any) {
      req.log.error({ err, file: file.originalname }, "Failed to import stem file");
      items.push({ fileName: file.originalname, status: "error", type: "stem", message: err.message || "Parse error" });
      failed++;
    }
  }

  res.json({ total: files.length, succeeded, failed, items });
});

// ─── Auto-detect stem type from filename ───────────────────────────────────
function inferStemType(filename: string): string | null {
  const lower = filename.toLowerCase();
  const patterns: [RegExp, string][] = [
    [/drum|kick|snare|hihat|hat|perc|808/i, "drums"],
    [/bass/i, "bass"],
    [/lead.?voc|main.?voc|vox.?lead/i, "lead_vocals"],
    [/back.?voc|harm|choir|bv\b|bg.?voc/i, "backing_vocals"],
    [/vocal|vox|voice|acap/i, "vocals"],
    [/guitar|gtr/i, "guitars"],
    [/key|piano|organ|clav/i, "keys"],
    [/synth|pad|arp|lead(?!.?voc)/i, "synth"],
    [/string|violin|cello|orch/i, "strings"],
    [/brass|horn|trumpet|sax/i, "brass"],
    [/fx|effect|sfx|foley|atmos|amb/i, "fx"],
    [/full.?mix|master|mixdown|final/i, "full_mix"],
    [/inst(rumental)?(?!.?mix)/i, "instrumental_mix"],
  ];
  for (const [re, type] of patterns) {
    if (re.test(lower)) return type;
  }
  return null;
}

// ─── Studio One XML Parser ──────────────────────────────────────────────────
function parseStudioOneSongXml(xml: string): Record<string, string> | null {
  try {
    const result: Record<string, string> = {};

    // Extract title / name
    const nameMatch = xml.match(/name="([^"]+)"/i) || xml.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (nameMatch) result.title = nameMatch[1];

    // Extract tempo/BPM
    const tempoMatch = xml.match(/tempo="([0-9.]+)"/i) || xml.match(/<tempo[^>]*>([0-9.]+)<\/tempo>/i)
      || xml.match(/Tempo[^>]*value="([0-9.]+)"/i) || xml.match(/<Tempo>([0-9.]+)<\/Tempo>/i);
    if (tempoMatch) result.tempo = tempoMatch[1];

    // Extract musical key
    const keyMatch = xml.match(/key="([^"]+)"/i) || xml.match(/<key[^>]*>([^<]+)<\/key>/i)
      || xml.match(/KeySignature[^>]*value="([^"]+)"/i);
    if (keyMatch) result.key = keyMatch[1];

    // Extract duration
    const durMatch = xml.match(/duration="([0-9.]+)"/i) || xml.match(/<duration[^>]*>([0-9.]+)<\/duration>/i)
      || xml.match(/Length="([0-9.]+)"/i);
    if (durMatch) result.duration = durMatch[1];

    // Extract artist
    const artistMatch = xml.match(/artist="([^"]+)"/i) || xml.match(/<artist[^>]*>([^<]+)<\/artist>/i);
    if (artistMatch) result.artist = artistMatch[1];

    // Extract genre
    const genreMatch = xml.match(/genre="([^"]+)"/i) || xml.match(/<genre[^>]*>([^<]+)<\/genre>/i);
    if (genreMatch) result.genre = genreMatch[1];

    return Object.keys(result).length > 0 ? result : null;
  } catch {
    return null;
  }
}

export default router;
