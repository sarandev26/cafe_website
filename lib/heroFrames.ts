import {
  heroFrameManager,
  chapterTwoFrameManager,
} from "./frameSequence";

export const TOTAL_HERO_FRAMES = heroFrameManager.count;
export const TOTAL_CHAPTER_TWO_FRAMES = chapterTwoFrameManager.count;

export const heroFramesCache = new Proxy([] as any[], {
  get: (target, prop) => {
    if (typeof prop === "string" && !isNaN(Number(prop))) {
      return heroFrameManager.getFrame(Number(prop));
    }
    return (target as any)[prop];
  },
});

export function getFrameUrl(index: number): string {
  return heroFrameManager.getFrameUrl(index);
}

export function preloadKeyFrame(index: number) {
  return heroFrameManager.decodeFrame(index);
}

export async function preloadHeroFrames(
  onProgress?: (percent: number, loaded: number, total: number) => void
): Promise<void> {
  const total = heroFrameManager.count + chapterTwoFrameManager.count;
  let heroLoaded = 0;
  let c2Loaded = 0;

  const update = () => {
    const loaded = heroLoaded + c2Loaded;
    const pct = Math.min(100, Math.round((loaded / total) * 100));
    if (onProgress) onProgress(pct, loaded, total);
  };

  await Promise.all([
    heroFrameManager.preloadCompressed((loaded) => {
      heroLoaded = loaded;
      update();
    }),
    chapterTwoFrameManager.preloadCompressed((loaded) => {
      c2Loaded = loaded;
      update();
    }),
  ]);

  // Decode initial windows for instant first scroll
  await Promise.all([
    heroFrameManager.decodeInitialWindow(40),
    chapterTwoFrameManager.decodeInitialWindow(40),
  ]);
}
