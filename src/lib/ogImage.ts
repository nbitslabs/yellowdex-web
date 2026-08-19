import type { OGImageOptions } from "astro-og-canvas";

/**
 * Shared Yellowdex-branded styling for build-time OG images (astro-og-canvas).
 * Used by the per-post route (src/pages/blog/og/[...slug].png.ts) and the
 * blog listing image (src/pages/blog/og.png.ts) so both stay on-brand.
 */
export function ogImageOptions(title: string, description: string): OGImageOptions {
  return {
    title,
    description,
    logo: {
      path: "./public/logo-yellowdex.png",
      size: [88, 88],
    },
    bgGradient: [
      [255, 250, 242], // paper
      [247, 238, 199], // panel
    ],
    border: { color: [244, 196, 81], width: 20, side: "inline-start" }, // sun
    padding: 72,
    font: {
      title: {
        color: [11, 16, 33], // charcoal
        size: 62,
        weight: "SemiBold",
        lineHeight: 1.15,
        families: ["Sora"],
      },
      description: {
        color: [71, 85, 105], // muted
        size: 30,
        weight: "Normal",
        lineHeight: 1.4,
        families: ["Space Grotesk"],
      },
    },
    fonts: ["./public/fonts/sora-600.ttf", "./public/fonts/space-grotesk-400.ttf"],
  };
}
