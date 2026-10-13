export interface ImageAsset {
  src: string;
  alt: string;
  width: number;
  height: number;
  blurDataURL?: string;
}

export const IMAGES = {
  hero: {
    poster: {
      src: "/images/hero-poster.webp",
      alt: "Aurelia Coffee House grand entrance and illuminated dining room",
      width: 1920,
      height: 1080,
    },
  },
  story: {
    farm: {
      src: "/images/story-1.webp",
      alt: "High-altitude coffee farm estate at sunrise",
      width: 800,
      height: 1000,
    },
    interior: {
      src: "/images/story-2.webp",
      alt: "Warm ambient seating and marble barista counter at Aurelia",
      width: 800,
      height: 1000,
    },
  },
  signatures: {
    latte: {
      src: "/images/signature-latte.webp",
      alt: "Aurelia Signature Latte with delicate rosette latte art",
      width: 900,
      height: 1200,
    },
    caramel: {
      src: "/images/signature-caramel.webp",
      alt: "Iced Amber Caramel with cascading cold cream and sea salt caramel",
      width: 900,
      height: 1200,
    },
    mocha: {
      src: "/images/signature-mocha.webp",
      alt: "Rouge Mocha with 72% dark chocolate and cocoa velvet froth",
      width: 900,
      height: 1200,
    },
    cortado: {
      src: "/images/signature-cortado.webp",
      alt: "Golden Cortado in a heavy faceted glass tumbler",
      width: 900,
      height: 1200,
    },
    coldbrew: {
      src: "/images/signature-coldbrew.webp",
      alt: "Cold Brew Noir with crystal clear ice sphere and draft crema",
      width: 900,
      height: 1200,
    },
    brioche: {
      src: "/images/signature-brioche.webp",
      alt: "Pistachio cardamom sourdough brioche knot on ceramic plate",
      width: 1200,
      height: 900,
    },
  },
  craft: {
    source: {
      src: "/images/craft-source.webp",
      alt: "Hand-harvesting ripe red coffee cherries at high altitude",
      width: 1200,
      height: 900,
    },
    roast: {
      src: "/images/craft-roast.webp",
      alt: "Cast-iron drum coffee roaster with golden glowing embers",
      width: 1200,
      height: 900,
    },
    brew: {
      src: "/images/craft-brew.webp",
      alt: "Barista measuring precision pour-over extraction with silver gooseneck kettle",
      width: 1200,
      height: 900,
    },
    serve: {
      src: "/images/craft-serve.webp",
      alt: "Aurelia hand-thrown ceramic cup presented on walnut tray",
      width: 1200,
      height: 900,
    },
  },
  craftDetails: {
    source: {
      src: "/images/craft-detail-source.webp",
      alt: "Macro close up of freshly picked dark red ripe coffee cherries",
      width: 1200,
      height: 900,
    },
    roast: {
      src: "/images/craft-detail-roast.webp",
      alt: "Freshly roasted coffee beans tumbling out of cast iron cooling tray",
      width: 1200,
      height: 900,
    },
    brew: {
      src: "/images/craft-detail-brew.webp",
      alt: "Single origin espresso stream flowing smoothly from portafilter",
      width: 1200,
      height: 900,
    },
    serve: {
      src: "/images/craft-detail-serve.webp",
      alt: "Barista pouring silky microfoam into flat white cup on walnut table",
      width: 1200,
      height: 900,
    },
  },
  ingredients: {
    espresso: {
      src: "/images/ingredient-espresso.webp",
      alt: "Dense viscous espresso crema pouring in golden stream",
      width: 800,
      height: 800,
    },
    milk: {
      src: "/images/ingredient-milk.webp",
      alt: "Steamed organic Jersey milk with micro-foam texture",
      width: 800,
      height: 800,
    },
    caramel: {
      src: "/images/ingredient-caramel.webp",
      alt: "Slow amber panela caramel ribbon with sea salt grains",
      width: 800,
      height: 800,
    },
    cocoa: {
      src: "/images/ingredient-cocoa.webp",
      alt: "Ecuadorian single-estate raw criollo cocoa beans and fine dust",
      width: 800,
      height: 800,
    },
    drinkHero: {
      src: "/images/ingredient-balance.webp",
      alt: "Centered deconstructed Aurelia artisan balance drink",
      width: 900,
      height: 1200,
    },
  },
  menuFeatured: [
    {
      id: "feat-1",
      name: "Geisha Reserve Pour-Over",
      category: "Single Origin",
      description: "Panama Hacienda La Esmeralda Geisha with jasmine and bergamot finish",
      price: "₹420",
      src: "/images/menu-featured-1.webp",
      alt: "Geisha Reserve Pour-Over brewed with glass dripper",
      badge: "Chef's Pick",
      tags: ["Seasonal", "Bestseller"],
    },
    {
      id: "feat-2",
      name: "Saffron Rose Cortado",
      category: "Signature Craft",
      description: "Kashmiri mongra saffron steeped in oat milk with slow-dripped espresso",
      price: "₹360",
      src: "/images/menu-featured-2.webp",
      alt: "Saffron Rose Cortado with delicate golden foam",
      badge: "Chef's Pick",
      tags: ["New", "Vegan"],
    },
    {
      id: "feat-3",
      name: "Pistachio Cardamom Brioche",
      category: "Viennoiserie",
      description: "Bronte pistachio praline swirled through wild sourdough brioche knot",
      price: "₹240",
      src: "/images/menu-featured-3.webp",
      alt: "Golden pistachio cardamom brioche pastry on slate slab",
      badge: "Chef's Pick",
      tags: ["Baked Fresh", "Bestseller"],
    },
  ],
  menu: {
    latte: {
      src: "/images/menu-latte.webp",
      alt: "Aurelia Signature Latte with microfoam art",
      width: 900,
      height: 1200,
    },
    pourover: {
      src: "/images/menu-pourover.webp",
      alt: "Pour-over Yirgacheffe coffee in carver carafe",
      width: 900,
      height: 1200,
    },
    flatwhite: {
      src: "/images/menu-flatwhite.webp",
      alt: "Velvet flat white in earthen ceramic cup",
      width: 900,
      height: 1200,
    },
    cortado: {
      src: "/images/menu-cortado.webp",
      alt: "Golden Cortado in heavy crystal tumbler",
      width: 900,
      height: 1200,
    },
    coldbrew: {
      src: "/images/menu-coldbrew.webp",
      alt: "Cold brew noir with clarity sphere",
      width: 900,
      height: 1200,
    },
    ambercaramel: {
      src: "/images/menu-ambercaramel.webp",
      alt: "Iced amber caramel layered with cold cream",
      width: 900,
      height: 1200,
    },
    tonic: {
      src: "/images/menu-tonic.webp",
      alt: "Espresso tonic with slice of dried blood orange",
      width: 900,
      height: 1200,
    },
    matcha: {
      src: "/images/menu-matcha.webp",
      alt: "Ceremonial grade Uji matcha whisked with oat foam",
      width: 900,
      height: 1200,
    },
    tea: {
      src: "/images/menu-tea.webp",
      alt: "Wild lavender Earl Grey in porcelain teapot",
      width: 900,
      height: 1200,
    },
    pastry1: {
      src: "/images/menu-pastry1.webp",
      alt: "Laminated cardamom knot pastry with crystallized sugar",
      width: 900,
      height: 1200,
    },
    pastry2: {
      src: "/images/menu-pastry2.webp",
      alt: "Tahitian vanilla canelé with dark caramelized shell",
      width: 900,
      height: 1200,
    },
    croissant: {
      src: "/images/menu-croissant.webp",
      alt: "Honeycomb French butter almond croissant",
      width: 900,
      height: 1200,
    },
    affogato: {
      src: "/images/menu-affogato.webp",
      alt: "Madagascar vanilla gelato topped with piping espresso shot",
      width: 900,
      height: 1200,
    },
    cascara: {
      src: "/images/menu-cascara.webp",
      alt: "Sparkling cascara coffee cherry tea infusion",
      width: 900,
      height: 1200,
    },
    nitro: {
      src: "/images/menu-cold-nitro.webp",
      alt: "Draft nitro cold brew with cascading velvet microfoam head",
      width: 900,
      height: 1200,
    },
    kyoto: {
      src: "/images/menu-cold-kyoto.webp",
      alt: "Kyoto slow-drip cold coffee over hand-carved ice sphere",
      width: 900,
      height: 1200,
    },
    shakerato: {
      src: "/images/menu-cold-shakerato.webp",
      alt: "Shakerato al limone frothed espresso in crystal coupe",
      width: 900,
      height: 1200,
    },
    whitetea: {
      src: "/images/menu-tea-whitetea.webp",
      alt: "Silver Needle white tea infusion in glass teacup",
      width: 900,
      height: 1200,
    },
    kahwa: {
      src: "/images/menu-tea-kahwa.webp",
      alt: "Kashmiri saffron kahwa tea in porcelain bowl",
      width: 900,
      height: 1200,
    },
    hojicha: {
      src: "/images/menu-tea-hojicha.webp",
      alt: "Roasted Japanese hojicha tea latte in ceramic cup",
      width: 900,
      height: 1200,
    },
    chocolat: {
      src: "/images/menu-pastry-chocolat.webp",
      alt: "Valrhona dark chocolate pain au chocolat pastry",
      width: 900,
      height: 1200,
    },
    kouign: {
      src: "/images/menu-pastry-kouign.webp",
      alt: "Caramelized Brittany Kouign-Amann pastry",
      width: 900,
      height: 1200,
    },
  },
  gallery: [
    {
      src: "/images/gallery-1.webp",
      alt: "Barista extracting rich double espresso shot",
      width: 1200,
      height: 800,
    },
    {
      src: "/images/gallery-2.webp",
      alt: "Intricate swan latte art in emerald green cup",
      width: 900,
      height: 1100,
    },
    {
      src: "/images/gallery-3.webp",
      alt: "Freshly roasted coffee beans cooling in copper tray",
      width: 800,
      height: 1000,
    },
    {
      src: "/images/gallery-4.webp",
      alt: "Flaky golden cardamom buns on bakery marble slab",
      width: 800,
      height: 1000,
    },
    {
      src: "/images/gallery-5.webp",
      alt: "Sunlit interior courtyard with velvet banquettes and ficus trees",
      width: 900,
      height: 1100,
    },
    {
      src: "/images/gallery-6.webp",
      alt: "Artisan matte ceramic cups stacked by the espresso machine",
      width: 1000,
      height: 750,
    },
    {
      src: "/images/gallery-7.webp",
      alt: "Close-up of freshly harvested dark red Geisha coffee cherries",
      width: 1000,
      height: 750,
    },
  ],
  stats: {
    bg: {
      src: "/images/stats-moody-beans.webp",
      alt: "Dark moody roasted specialty coffee beans on matte slate with warm amber reflections",
      width: 1920,
      height: 1080,
    },
  },
  testimonials: [
    {
      src: "/images/testimonial-1.webp",
      alt: "Warm intimate flat white with rosette latte art in handcrafted terracotta cup",
      width: 800,
      height: 600,
    },
    {
      src: "/images/testimonial-2.webp",
      alt: "Pour-over coffee brewing into glass carafe in warm morning cafe sunlight",
      width: 800,
      height: 600,
    },
    {
      src: "/images/testimonial-3.webp",
      alt: "Artisanal cortado in faceted glass tumbler with flaky golden French croissant",
      width: 800,
      height: 600,
    },
  ],
  reserve: {
    photo: {
      src: "/images/reserve-tall.webp",
      alt: "Candle-lit table reservation booth in intimate European cafe atmosphere",
      width: 900,
      height: 1200,
    },
  },
  visit: {
    map: {
      src: "/images/map-cafe.webp",
      alt: "Stylized architectural location map of Aurelia Coffee House in Indiranagar",
      width: 1200,
      height: 800,
    },
    bookingBg: {
      src: "/images/visit-booking-bg.webp",
      alt: "Intimate candle-lit coffee house table setting with velvet seating",
      width: 1920,
      height: 1080,
    },
  },
} as const;
