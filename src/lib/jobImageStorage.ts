import path from "path";
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "jobs");

/**
 * Saves a base64 data URI as a file on disk.
 * Returns the public URL path (e.g., "/uploads/jobs/abc123.jpg").
 * If the input is already a file URL (not base64), returns it unchanged.
 */
export async function saveJobImageToDisk(dataUrl: string): Promise<string> {
  // If already a file URL (not base64), return as-is
  if (!dataUrl.startsWith("data:")) {
    return dataUrl;
  }

  // Ensure upload directory exists
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }

  // Parse base64 data URI
  const matches = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!matches) {
    throw new Error("Invalid image data URI");
  }

  let ext = matches[1];
  if (ext === "jpeg") ext = "jpg";
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, "base64");

  // Generate unique filename
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const filename = `${uniqueSuffix}.${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);

  await writeFile(filepath, buffer);

  return `/uploads/jobs/${filename}`;
}

/**
 * Deletes a job image file from disk if it's a local file URL.
 * Silently ignores non-local URLs (external or base64) and missing files.
 */
export async function deleteJobImageFile(url: string): Promise<void> {
  // Only delete local file URLs
  if (!url.startsWith("/uploads/jobs/")) {
    return;
  }

  const filepath = path.join(process.cwd(), "public", url);

  // Security check to prevent directory traversal
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "jobs");
  if (!filepath.startsWith(uploadsDir)) {
    return;
  }

  try {
    if (existsSync(filepath)) {
      await unlink(filepath);
    }
  } catch {
    // Silently ignore deletion errors
  }
}
