/**
 * Shrinks a photo in the browser before upload so phone pictures (often 3–8 MB)
 * become ~100–200 KB WebP files. Falls back to the original if the browser can't encode WebP.
 */
export async function resizeImage(file: File, maxSize = 1000, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
  return blob && blob.type === "image/webp" ? blob : file;
}
