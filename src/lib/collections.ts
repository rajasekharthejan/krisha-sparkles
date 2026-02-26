export interface CollectionSeed {
  handle: string;
  title: string;
  description: string;
  filter_category_slugs: string[];
  meta_title: string;
  meta_description: string;
}

export const DEFAULT_COLLECTIONS: CollectionSeed[] = [
  {
    handle: "wedding-jewelry",
    title: "Wedding Jewelry",
    description: "Exquisite bridal sets, necklaces, and earrings for your special day.",
    filter_category_slugs: ["necklaces", "earrings", "pendant-sets"],
    meta_title: "Wedding Jewelry — Krisha Sparkles",
    meta_description: "Shop our stunning bridal jewelry collection. Necklaces, earrings, and pendant sets for your wedding day.",
  },
  {
    handle: "diwali-collection",
    title: "Diwali Collection",
    description: "Celebrate the festival of lights with our handpicked Diwali jewelry.",
    filter_category_slugs: ["bangles-bracelets", "earrings", "necklaces"],
    meta_title: "Diwali Collection — Krisha Sparkles",
    meta_description: "Light up your Diwali with our festive jewelry collection.",
  },
  {
    handle: "trending-earrings",
    title: "Trending Earrings",
    description: "Our most-loved earring styles, from hoops to chandeliers.",
    filter_category_slugs: ["earrings"],
    meta_title: "Trending Earrings — Krisha Sparkles",
    meta_description: "Shop the most popular earring styles at Krisha Sparkles.",
  },
  {
    handle: "party-wear-dresses",
    title: "Party Wear Dresses",
    description: "Turn heads at every celebration with our party-ready ethnic dresses.",
    filter_category_slugs: ["dresses"],
    meta_title: "Party Wear Dresses — Krisha Sparkles",
    meta_description: "Shop our vibrant party wear and ethnic dress collection.",
  },
  {
    handle: "daily-wear",
    title: "Daily Wear",
    description: "Understated elegance for every day. Lightweight jewelry made for real life.",
    filter_category_slugs: ["earrings", "bangles-bracelets"],
    meta_title: "Daily Wear Jewelry — Krisha Sparkles",
    meta_description: "Everyday lightweight jewelry from Krisha Sparkles.",
  },
];
