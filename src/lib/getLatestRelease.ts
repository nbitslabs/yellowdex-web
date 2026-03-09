import { marked } from "marked";

const API_URL = "https://api.github.com/repos/nbitslabs/yellowdex-ext/releases/latest";

export interface LatestRelease {
  tagName: string;
  name: string;
  htmlUrl: string;
  publishedAt: string | null;
  publishedOn: string | null;
  excerpt: string;
  bodyHtml: string;
}

export async function getLatestRelease(): Promise<LatestRelease | null> {
  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "yellowdex-web",
    };

    const token = process.env.GITHUB_TOKEN || process.env.PUBLIC_GITHUB_TOKEN;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(API_URL, { headers });
    if (!res.ok) return null;

    const data = await res.json();
    if (!data || !data.tag_name) return null;

    const publishedAt: string | null = data.published_at || data.created_at || null;
    const bodyHtml = await marked.parse(data.body || "", { gfm: true, breaks: true });
    return {
      tagName: data.tag_name,
      name: data.name || data.tag_name,
      htmlUrl: data.html_url || "",
      publishedAt,
      publishedOn: publishedAt ? formatDate(publishedAt) : null,
      excerpt: makeExcerpt(data.body || ""),
      bodyHtml,
    };
  } catch (err) {
    console.error("getLatestRelease failed", err);
    return null;
  }
}

function makeExcerpt(body: string): string {
  const firstPara = body.trim().split(/\n\s*\n/)[0] || "";
  const text = firstPara.replace(/[\r\n]+/g, " ").trim();
  if (!text) return "Release notes are available on GitHub.";
  return text.length > 420 ? `${text.slice(0, 400).trim()}…` : text;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return iso;
  }
}
