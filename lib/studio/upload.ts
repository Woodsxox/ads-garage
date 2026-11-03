const RASTER = ["image/png", "image/jpeg", "image/webp"];
const MAX_INPUT_BYTES = 8 * 1024 * 1024;
const MAX_SVG_BYTES = 300 * 1024;

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("The file could not be read."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("That file is not a readable image."));
    img.src = src;
  });
}

/**
 * Turns an uploaded image into a data URL small enough to keep in browser storage.
 * Raster images are downscaled; SVG is kept as-is but only used inside <img>, where scripts cannot run.
 */
export async function fileToDataUrl(file: File, maxDimension = 1400): Promise<string> {
  if (file.size > MAX_INPUT_BYTES) throw new Error("Choose an image under 8 MB.");

  if (file.type === "image/svg+xml") {
    if (file.size > MAX_SVG_BYTES) throw new Error("SVG files must be under 300 KB.");
    return readAsDataUrl(file);
  }
  if (!RASTER.includes(file.type)) throw new Error("Use a PNG, JPEG, WebP or SVG image.");

  const img = await loadImage(await readAsDataUrl(file));
  const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  // Keep transparency for PNG; everything else becomes a compact JPEG.
  return file.type === "image/png" ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.86);
}
