import type { APIRoute } from "astro";
import { getAllReleases } from "../lib/getLatestRelease";

export const GET: APIRoute = async () => {
  const releases = await getAllReleases();

  const body = releases.length > 0
    ? releases.map((r) =>
        `## ${r.name} (${r.tagName})${r.publishedOn ? ` — ${r.publishedOn}` : ""}

${r.excerpt}

Full release notes: ${r.htmlUrl}`
      ).join("\n\n")
    : "No releases published yet.";

  const content = `# Yellowdex Release Notes

Every update to the Yellowdex Chrome extension.

${body}
`;

  return new Response(content, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
};
