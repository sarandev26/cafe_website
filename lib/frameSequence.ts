import heroManifestData from "@/public/hero/manifest.json";
import chapterTwoManifestData from "@/public/chapter-two/manifest.json";

export interface FrameManifest {
  section: string;
  count: number;
  width: number;
  height: number;
  filePattern: string;
  cutIndices: number[];
  cuts?: { cutFrame: number; nextFrame: number; diffScore: number; ratio: number }[];
}

function smoothstep(min: number, max: number, value: number) {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

export class FrameSequenceManager {
  readonly manifest: FrameManifest;
  readonly basePath: string;
  readonly count: number;
  readonly width: number;
  readonly height: number;
  readonly cutIndices: number[];

  private blobs: (Blob | null)[];
  private decodedCache: (ImageBitmap | HTMLImageElement | null)[];
  private decodingMap: Map<number, Promise<ImageBitmap | HTMLImageElement | null>>;
  private preloadedPromise: Promise<void> | null = null;
  private lastIndex: number = 0;

  constructor(basePath: string, manifest: FrameManifest) {
    this.basePath = basePath;
    this.manifest = manifest;
    this.count = manifest.count;
    this.width = manifest.width;
    this.height = manifest.height;
    this.cutIndices = manifest.cutIndices || [];

    this.blobs = new Array(this.count).fill(null);
    this.decodedCache = new Array(this.count).fill(null);
    this.decodingMap = new Map();
  }

  getFrameUrl(index: number): string {
    const clamped = Math.max(0, Math.min(this.count - 1, index));
    const pad = String(clamped + 1).padStart(4, "0");
    const isMobileOrLowPower =
      typeof window !== "undefined" &&
      (window.innerWidth < 768 ||
        ((navigator as any).deviceMemory && (navigator as any).deviceMemory <= 4) ||
        ((navigator as any).hardwareConcurrency && (navigator as any).hardwareConcurrency <= 4));

    if (isMobileOrLowPower) {
      return `${this.basePath}/mobile/frame_${pad}.webp`;
    }
    return `${this.basePath}/frame_${pad}.webp`;
  }

  async preloadCompressed(
    onProgress?: (loaded: number, total: number) => void
  ): Promise<void> {
    if (this.preloadedPromise) return this.preloadedPromise;

    this.preloadedPromise = new Promise<void>(async (resolve) => {
      let loaded = 0;
      const concurrency = 12;
      const indices = Array.from({ length: this.count }, (_, i) => i);
      let nextIdx = 0;

      const fetchIndex = async (i: number) => {
        if (this.blobs[i]) {
          loaded++;
          if (onProgress) onProgress(loaded, this.count);
          return;
        }
        try {
          const res = await fetch(this.getFrameUrl(i));
          const blob = await res.blob();
          this.blobs[i] = blob;
        } catch (e) {
          // Retry once on failure
          try {
            const res = await fetch(this.getFrameUrl(i));
            const blob = await res.blob();
            this.blobs[i] = blob;
          } catch {}
        }
        loaded++;
        if (onProgress) onProgress(loaded, this.count);
      };

      const worker = async (): Promise<void> => {
        while (nextIdx < indices.length) {
          const i = indices[nextIdx++];
          await fetchIndex(i);
        }
      };

      const workers = Array.from({ length: concurrency }, () => worker());
      await Promise.all(workers);
      resolve();
    });

    return this.preloadedPromise;
  }

  async decodeFrame(index: number): Promise<ImageBitmap | HTMLImageElement | null> {
    const clamped = Math.max(0, Math.min(this.count - 1, index));
    if (this.decodedCache[clamped]) {
      return this.decodedCache[clamped];
    }
    if (this.decodingMap.has(clamped)) {
      return this.decodingMap.get(clamped)!;
    }

    const decodePromise = (async () => {
      try {
        let blob = this.blobs[clamped];
        if (!blob) {
          const res = await fetch(this.getFrameUrl(clamped));
          blob = await res.blob();
          this.blobs[clamped] = blob;
        }

        if (typeof window !== "undefined" && "createImageBitmap" in window) {
          const bitmap = await createImageBitmap(blob);
          this.decodedCache[clamped] = bitmap;
          return bitmap;
        } else {
          return new Promise<HTMLImageElement | null>((res) => {
            const img = new Image();
            img.src = this.getFrameUrl(clamped);
            img.decode().then(() => {
              this.decodedCache[clamped] = img;
              res(img);
            }).catch(() => {
              this.decodedCache[clamped] = img;
              res(img);
            });
          });
        }
      } catch {
        return null;
      } finally {
        this.decodingMap.delete(clamped);
      }
    })();

    this.decodingMap.set(clamped, decodePromise);
    return decodePromise;
  }

  async decodeInitialWindow(windowSize = 40): Promise<void> {
    const countToDecode = Math.min(this.count, windowSize);
    const promises: Promise<any>[] = [];
    for (let i = 0; i < countToDecode; i++) {
      promises.push(this.decodeFrame(i));
    }
    await Promise.all(promises);
  }

  updateSlidingWindow(currentIndex: number, ahead = 60, behind = 20): void {
    const direction = currentIndex >= this.lastIndex ? 1 : -1;
    this.lastIndex = currentIndex;

    let winStart: number;
    let winEnd: number;

    if (direction >= 0) {
      winStart = Math.max(0, currentIndex - behind);
      winEnd = Math.min(this.count - 1, currentIndex + ahead);
    } else {
      winStart = Math.max(0, currentIndex - ahead);
      winEnd = Math.min(this.count - 1, currentIndex + behind);
    }

    // Evict frames outside window
    for (let i = 0; i < this.count; i++) {
      if ((i < winStart || i > winEnd) && this.decodedCache[i]) {
        const item = this.decodedCache[i];
        if (item && "close" in item && typeof item.close === "function") {
          item.close();
        }
        this.decodedCache[i] = null;
      }
    }

    // Gather candidate frames needing decode inside window
    const candidates: number[] = [];
    for (let i = winStart; i <= winEnd; i++) {
      if (!this.decodedCache[i] && !this.decodingMap.has(i)) {
        candidates.push(i);
      }
    }

    // Prioritize decoding: closest to currentIndex first
    candidates.sort((a, b) => Math.abs(a - currentIndex) - Math.abs(b - currentIndex));

    // Launch background decodes smoothly (up to 6 per tick to prevent worker saturation)
    for (const idx of candidates.slice(0, 6)) {
      this.decodeFrame(idx);
    }
  }

  getFrame(index: number): ImageBitmap | HTMLImageElement | null {
    const clamped = Math.max(0, Math.min(this.count - 1, Math.round(index)));
    if (this.decodedCache[clamped]) {
      return this.decodedCache[clamped];
    }

    // Fallback: search nearest decoded frame to prevent black/empty frame
    for (let delta = 1; delta < this.count; delta++) {
      const left = clamped - delta;
      if (left >= 0 && this.decodedCache[left]) {
        return this.decodedCache[left];
      }
      const right = clamped + delta;
      if (right < this.count && this.decodedCache[right]) {
        return this.decodedCache[right];
      }
    }

    return null;
  }

  drawSingleImage(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    img: HTMLImageElement | ImageBitmap,
    alpha = 1
  ): void {
    const imgWidth = "width" in img ? img.width : (img as HTMLImageElement).naturalWidth;
    const imgHeight = "height" in img ? img.height : (img as HTMLImageElement).naturalHeight;
    if (!imgWidth || !imgHeight) return;

    const imgRatio = imgWidth / imgHeight;
    const canvasRatio = canvas.width / canvas.height;

    let drawW = canvas.width;
    let drawH = canvas.height;

    if (imgRatio > canvasRatio) {
      drawH = canvas.height;
      drawW = canvas.height * imgRatio;
    } else {
      drawW = canvas.width;
      drawH = canvas.width / imgRatio;
    }

    const drawX = (canvas.width - drawW) / 2;
    const drawY = (canvas.height - drawH) / 2;

    if (alpha < 1) {
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    }
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    if (alpha < 1) {
      ctx.globalAlpha = 1.0;
    }
  }

  draw(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    targetPos: number,
    cutWindow = 8
  ): boolean {
    const clampedPos = Math.max(0, Math.min(this.count - 1, targetPos));
    const roundIdx = Math.round(clampedPos);
    this.updateSlidingWindow(roundIdx);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "medium";

    // 1. Scene cut crossfade check over fixed scroll distance (cutWindow frames)
    for (const cut of this.cutIndices) {
      const halfWin = cutWindow / 2;
      const winStart = cut - halfWin;
      const winEnd = cut + halfWin;

      if (clampedPos >= winStart && clampedPos <= winEnd) {
        const t = smoothstep(winStart, winEnd, clampedPos);
        const outIdx = Math.max(0, cut - 1);
        const inIdx = Math.min(this.count - 1, cut);

        const outImg = this.getFrame(outIdx);
        const inImg = this.getFrame(inIdx);

        if (outImg && inImg) {
          this.drawSingleImage(ctx, canvas, outImg, 1.0);
          this.drawSingleImage(ctx, canvas, inImg, t);
          return true;
        } else if (outImg) {
          this.drawSingleImage(ctx, canvas, outImg, 1.0);
          return true;
        } else if (inImg) {
          this.drawSingleImage(ctx, canvas, inImg, 1.0);
          return true;
        }
      }
    }

    // 2. Continuous fractional frame blending (floor and ceil)
    const floorIdx = Math.floor(clampedPos);
    const ceilIdx = Math.min(this.count - 1, floorIdx + 1);
    const frac = clampedPos - floorIdx;

    const floorImg = this.getFrame(floorIdx);
    if (!floorImg) {
      return false;
    }

    this.drawSingleImage(ctx, canvas, floorImg, 1.0);

    if (frac > 0.005 && ceilIdx !== floorIdx) {
      const ceilImg = this.getFrame(ceilIdx);
      if (ceilImg) {
        this.drawSingleImage(ctx, canvas, ceilImg, frac);
      }
    }

    return true;
  }

  drawPreview(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    targetPos: number
  ): void {
    const clampedPos = Math.max(0, Math.min(this.count - 1, targetPos));
    const floorIdx = Math.floor(clampedPos);
    const ceilIdx = Math.min(this.count - 1, floorIdx + 1);
    const frac = clampedPos - floorIdx;

    const floorImg = this.getFrame(floorIdx);
    if (!floorImg) return;

    ctx.drawImage(floorImg, 0, 0, w, h);
    if (frac > 0.005 && ceilIdx !== floorIdx) {
      const ceilImg = this.getFrame(ceilIdx);
      if (ceilImg) {
        ctx.globalAlpha = frac;
        ctx.drawImage(ceilImg, 0, 0, w, h);
        ctx.globalAlpha = 1.0;
      }
    }
  }
}

export const heroFrameManager = new FrameSequenceManager(
  "/hero",
  heroManifestData as FrameManifest
);

export const chapterTwoFrameManager = new FrameSequenceManager(
  "/chapter-two",
  chapterTwoManifestData as FrameManifest
);
