import type { APIRoute } from "astro";
import { generateOpenGraphImage } from "astro-og-canvas";
import { ogImageOptions } from "../../lib/ogImage";

// Build-time OG image for the blog listing at /blog/og.png.
export const GET: APIRoute = async () => {
  const image = await generateOpenGraphImage(
    ogImageOptions(
      "The Yellowdex blog",
      "Notes on labeling crypto addresses, on-chain context, and blockchain intelligence tools.",
    ),
  );
  return new Response(image, {
    headers: { "Content-Type": "image/png" },
  });
};
