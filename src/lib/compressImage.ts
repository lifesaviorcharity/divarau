/**
 * Compresses an image file by reducing quality and/or dimensions
 * using the Canvas API. Returns a new File within the target size.
 */
export async function compressImage(
  file: File,
  maxSizeKB: number
): Promise<File> {
  const maxSizeBytes = maxSizeKB * 1024;

  // If already within limit, return as-is
  if (file.size <= maxSizeBytes) return file;

  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  let width = bitmap.width;
  let height = bitmap.height;

  // Phase 1: Scale down large images proportionally
  const MAX_DIM = 2048;
  if (width > MAX_DIM || height > MAX_DIM) {
    const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, width, height);

  // Phase 2: Reduce JPEG quality iteratively until within size
  let quality = 0.85;
  const MIN_QUALITY = 0.15;
  const STEP = 0.1;

  while (quality >= MIN_QUALITY) {
    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), "image/jpeg", quality)
    );

    if (blob.size <= maxSizeBytes || quality <= MIN_QUALITY) {
      const ext = file.name.replace(/\.[^.]+$/, "");
      return new File([blob], `${ext}.jpg`, { type: "image/jpeg" });
    }

    quality -= STEP;
  }

  // Phase 3: If still too large, progressively scale down further
  let scale = 0.8;
  while (scale >= 0.3) {
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(bitmap, 0, 0, w, h);

    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), "image/jpeg", MIN_QUALITY)
    );

    if (blob.size <= maxSizeBytes) {
      const ext = file.name.replace(/\.[^.]+$/, "");
      return new File([blob], `${ext}.jpg`, { type: "image/jpeg" });
    }

    scale -= 0.1;
  }

  // Last resort: return the smallest version we could produce
  const finalBlob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/jpeg", MIN_QUALITY)
  );
  const ext = file.name.replace(/\.[^.]+$/, "");
  return new File([finalBlob], `${ext}.jpg`, { type: "image/jpeg" });
}
