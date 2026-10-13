import fs from 'fs';
import path from 'path';
import https from 'https';
import sharp from 'sharp';

const outputDir = path.resolve('public/images');
const videoDir = path.resolve('public/video');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });

// First, convert ezgif-frame-001.jpg from "Cafe Video" to hero-poster.webp
const sampleFrame = path.resolve('Cafe Video/ezgif-frame-001.jpg');
if (fs.existsSync(sampleFrame)) {
  try {
    await sharp(sampleFrame)
      .resize(1920, 1080, { fit: 'cover' })
      .webp({ quality: 85 })
      .toFile(path.join(outputDir, 'hero-poster.webp'));
    console.log('✓ Created public/images/hero-poster.webp from Cafe Video');
  } catch (err) {
    console.error('Error creating hero-poster:', err);
  }
}

// Curated list of high-end editorial coffee photography from Unsplash
const imageMap = [
  // Signatures
  { name: 'signature-latte.webp', url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=1000&q=85', w: 900, h: 1200 },
  { name: 'signature-caramel.webp', url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=1000&q=85', w: 900, h: 1200 },
  { name: 'signature-mocha.webp', url: 'https://images.unsplash.com/photo-1572442388796-11668ba67e53?auto=format&fit=crop&w=1000&q=85', w: 900, h: 1200 },
  { name: 'signature-cortado.webp', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1000&q=85', w: 900, h: 1200 },
  { name: 'signature-coldbrew.webp', url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=1000&q=85', w: 900, h: 1200 },

  // Story
  { name: 'story-1.webp', url: 'https://images.unsplash.com/photo-1611162458324-aae1eb4129a4?auto=format&fit=crop&w=1000&q=85', w: 800, h: 1000 },
  { name: 'story-2.webp', url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1000&q=85', w: 800, h: 1000 },

  // Craft
  { name: 'craft-source.webp', url: 'https://images.unsplash.com/photo-1524350876685-274059332603?auto=format&fit=crop&w=1200&q=85', w: 1200, h: 900 },
  { name: 'craft-roast.webp', url: 'https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?auto=format&fit=crop&w=1200&q=85', w: 1200, h: 900 },
  { name: 'craft-brew.webp', url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=85', w: 1200, h: 900 },
  { name: 'craft-serve.webp', url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=85', w: 1200, h: 900 },

  // Ingredients
  { name: 'ingredient-espresso.webp', url: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=800&q=85', w: 800, h: 800 },
  { name: 'ingredient-milk.webp', url: 'https://images.unsplash.com/photo-1534040385115-33dcb3acba5b?auto=format&fit=crop&w=800&q=85', w: 800, h: 800 },
  { name: 'ingredient-caramel.webp', url: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=85', w: 800, h: 800 },
  { name: 'ingredient-cocoa.webp', url: 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?auto=format&fit=crop&w=800&q=85', w: 800, h: 800 },

  // Menu items
  { name: 'menu-latte.webp', url: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=800&q=85', w: 800, h: 800 },
  { name: 'menu-pourover.webp', url: 'https://images.unsplash.com/photo-1518832553480-cd0e625ed3e6?auto=format&fit=crop&w=800&q=85', w: 800, h: 800 },
  { name: 'menu-flatwhite.webp', url: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&w=800&q=85', w: 800, h: 800 },
  { name: 'menu-tonic.webp', url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=85', w: 800, h: 800 },
  { name: 'menu-matcha.webp', url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=800&q=85', w: 800, h: 800 },
  { name: 'menu-tea.webp', url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=85', w: 800, h: 800 },
  { name: 'menu-pastry1.webp', url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=85', w: 800, h: 800 },
  { name: 'menu-pastry2.webp', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=85', w: 800, h: 800 },

  // Gallery
  { name: 'gallery-1.webp', url: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=1200&q=85', w: 1200, h: 800 },
  { name: 'gallery-2.webp', url: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=900&q=85', w: 900, h: 1100 },
  { name: 'gallery-3.webp', url: 'https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?auto=format&fit=crop&w=800&q=85', w: 800, h: 1000 },
  { name: 'gallery-4.webp', url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=85', w: 800, h: 1000 },
  { name: 'gallery-5.webp', url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=900&q=85', w: 900, h: 1100 },
  { name: 'gallery-6.webp', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1000&q=85', w: 1000, h: 750 },
  { name: 'gallery-7.webp', url: 'https://images.unsplash.com/photo-1524350876685-274059332603?auto=format&fit=crop&w=1000&q=85', w: 1000, h: 750 },

  // Visit Map
  { name: 'map-cafe.webp', url: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1200&q=85', w: 1200, h: 800 },
];

function downloadFile(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return downloadFile(response.headers.location).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
      }
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

async function processImages() {
  for (const item of imageMap) {
    const dest = path.join(outputDir, item.name);
    if (fs.existsSync(dest)) {
      console.log(`Skipping existing ${item.name}`);
      continue;
    }
    try {
      console.log(`Downloading ${item.name}...`);
      const buffer = await downloadFile(item.url);
      await sharp(buffer)
        .resize(item.w, item.h, { fit: 'cover' })
        .webp({ quality: 82 })
        .toFile(dest);
      console.log(`✓ Processed ${item.name}`);
    } catch (err) {
      console.warn(`! Fallback for ${item.name}:`, err.message);
      // Create rich burgundy gradient fallback image so it never fails
      const svg = `
        <svg width="${item.w}" height="${item.h}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="bg" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stop-color="#5A1420"/>
              <stop offset="100%" stop-color="#1E060A"/>
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#bg)"/>
          <circle cx="${item.w/2}" cy="${item.h/2}" r="${Math.min(item.w, item.h)*0.2}" stroke="#D4AF7A" stroke-width="2" fill="none" opacity="0.3"/>
          <text x="50%" y="50%" fill="#D4AF7A" font-family="serif" font-size="24" text-anchor="middle" dominant-baseline="middle" opacity="0.6">AURELIA</text>
        </svg>
      `;
      await sharp(Buffer.from(svg)).webp().toFile(dest);
    }
  }
}

await processImages();
console.log('All image assets processed successfully.');
