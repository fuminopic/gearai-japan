const mountainImageUrls: Record<string, string> = {
  "takao-san":
    "https://images.unsplash.com/photo-1499363536502-87642509e31b?auto=format&fit=crop&w=1200&q=80",
  "kumotori-yama":
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80",
  "tsubakuro-dake":
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
  "jonen-dake":
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
  "cho-gatake":
    "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=1200&q=80",
  "yari-gatake":
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80",
  "oku-hotaka-dake":
    "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?auto=format&fit=crop&w=1200&q=80"
};

export function getMountainImageUrl(slug: string) {
  return mountainImageUrls[slug] ?? null;
}
