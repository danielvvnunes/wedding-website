import { createClient } from "@supabase/supabase-js";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const BUCKET = "wedding-gallery";
const FEED_SIZE = "900";
const THUMB_SIZE = "520";
const JPEG_QUALITY = "62";

function parseEnv(content) {
  return Object.fromEntries(
    content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const separatorIndex = line.indexOf("=");
        const key = line.slice(0, separatorIndex);
        const value = line.slice(separatorIndex + 1).replace(/^['"]|['"]$/g, "");
        return [key, value];
      }),
  );
}

function isImageType(type) {
  return type?.startsWith("image/");
}

function getVariantBasePath(filePath) {
  const originalMatch = filePath.match(/^(.*\/)?([^/]+)\/original\.[^/.]+$/);
  if (originalMatch) return `${originalMatch[1] || ""}${originalMatch[2]}`;

  return filePath.replace(/\.[^/.]+$/, "");
}

async function publicFileExists(url) {
  const response = await fetch(url, { method: "HEAD" });
  return response.ok;
}

async function resizeJpeg(inputPath, outputPath, maxSize) {
  await execFileAsync("sips", [
    "-Z",
    maxSize,
    "--setProperty",
    "format",
    "jpeg",
    "--setProperty",
    "formatOptions",
    JPEG_QUALITY,
    inputPath,
    "--out",
    outputPath,
  ]);
}

async function uploadFile(supabase, storagePath, localPath) {
  const file = await readFile(localPath);
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
    cacheControl: "31536000",
    contentType: "image/jpeg",
    upsert: false,
  });

  if (error && !error.message?.toLowerCase().includes("already exists")) {
    throw error;
  }
}

async function main() {
  const env = parseEnv(await readFile(".env.local", "utf8"));
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase
    .from("wedding_gallery")
    .select("file_url, file_type, file_path, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const items = (data || []).filter(
    (item) => isImageType(item.file_type) && item.file_path && item.file_url,
  );

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const [index, item] of items.entries()) {
    const basePath = getVariantBasePath(item.file_path);
    const feedPath = `${basePath}/feed.jpg`;
    const thumbPath = `${basePath}/thumb.jpg`;
    const { data: thumbData } = supabase.storage.from(BUCKET).getPublicUrl(thumbPath);

    if (await publicFileExists(thumbData.publicUrl)) {
      skipped += 1;
      console.log(`[${index + 1}/${items.length}] skip ${item.file_path}`);
      continue;
    }

    const workDir = await mkdtemp(path.join(tmpdir(), "fd-gallery-"));
    const originalPath = path.join(workDir, "original");
    const feedLocalPath = path.join(workDir, "feed.jpg");
    const thumbLocalPath = path.join(workDir, "thumb.jpg");

    try {
      console.log(`[${index + 1}/${items.length}] create ${item.file_path}`);
      const response = await fetch(item.file_url);
      if (!response.ok) throw new Error(`Download failed with ${response.status}`);

      await writeFile(originalPath, Buffer.from(await response.arrayBuffer()));
      await resizeJpeg(originalPath, feedLocalPath, FEED_SIZE);
      await resizeJpeg(originalPath, thumbLocalPath, THUMB_SIZE);
      await uploadFile(supabase, feedPath, feedLocalPath);
      await uploadFile(supabase, thumbPath, thumbLocalPath);
      created += 1;
    } catch (error) {
      failed += 1;
      console.error(`Failed ${item.file_path}: ${error.message}`);
    } finally {
      await rm(workDir, { force: true, recursive: true });
    }
  }

  console.log(`Done. Created: ${created}. Skipped: ${skipped}. Failed: ${failed}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
