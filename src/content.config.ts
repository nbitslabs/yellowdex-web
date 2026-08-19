import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Blog posts authored as MDX in src/content/blog/. The file's basename is the
// URL slug (e.g. yellowdex-vs-chainalysis-arkham-nansen.mdx → /blog/<slug>/).
// The listing page, dynamic route, blog sitemap, and llms.txt all read this
// collection, so adding a post is: drop an .mdx file here with valid frontmatter.
const blog = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // ISO date (YYYY-MM-DD) — used for <time>, JSON-LD, and sitemap lastmod.
    pubDate: z.coerce.date(),
    // Short tag shown above the title (e.g. "Comparison").
    category: z.string().default("Article"),
    // Reading-time hint shown on the listing and post header.
    readingTime: z.string(),
    // Optional per-post social image; falls back to the site default.
    ogImage: z.string().optional(),
    // Set true to hide from the listing/sitemap without deleting the file.
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
