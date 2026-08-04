// Build-time client for the Yellowdex public collections directory.
//
// The directory projects the curated owner's public collections into static,
// SEO-friendly pages. Data is fetched from the public API at build time; any
// fetch failure degrades gracefully to an empty directory so the build never
// fails (mirrors src/lib/getLatestRelease.ts).

const API_BASE = "https://sync.yellowdex.ai/api/v1";

// Owner handle whose public collections make up the directory. The curated
// `yellowdex` org is the default; override with PUBLIC_DIRECTORY_OWNER.
const OWNER_HANDLE = process.env.PUBLIC_DIRECTORY_OWNER || "yellowdex";

// At most 500 addresses are surfaced per collection (the API's page cap),
// paginated 100 per page — up to 5 pages of directory content per collection.
export const ADDRESSES_PER_COLLECTION = 500;
export const PAGE_SIZE = 100;

export interface DirectoryNetwork {
  id: string;
  name: string;
  shortName: string;
  slug: string;
}

export interface DirectoryAddress {
  address: string;
  label: string;
  entity: string;
  network: DirectoryNetwork | null;
}

export interface DirectoryCollection {
  id: string;
  name: string;
  description: string;
  slug: string;
  addressCount: number;
  lastUpdatedAt: string | null;
  visibility: string;
}

export interface DirectoryEntry {
  collection: DirectoryCollection;
  addresses: DirectoryAddress[];
  totalPages: number;
}

const headers: Record<string, string> = {
  Accept: "application/json",
  "User-Agent": "yellowdex-web",
};

async function fetchPublicCollections(): Promise<DirectoryCollection[]> {
  try {
    const res = await fetch(
      `${API_BASE}/public/owners/${encodeURIComponent(OWNER_HANDLE)}/collections`,
      { headers },
    );
    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data
      .filter((c) => c && c.slug && c.visibility === "public")
      .map((c) => ({
        id: String(c.id),
        name: c.name || c.slug,
        description: c.description || "",
        slug: String(c.slug),
        addressCount: Number(c.addressCount) || 0,
        lastUpdatedAt: c.lastUpdatedAt || null,
        visibility: c.visibility,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    console.error("fetchPublicCollections failed", err);
    return [];
  }
}

async function fetchCollectionAddresses(id: string): Promise<DirectoryAddress[]> {
  try {
    const res = await fetch(
      `${API_BASE}/collections/${encodeURIComponent(id)}/addresses/page?limit=${ADDRESSES_PER_COLLECTION}`,
      { headers },
    );
    if (!res.ok) return [];

    const data = await res.json();
    const addresses = Array.isArray(data?.addresses) ? data.addresses : [];

    return addresses
      .filter((a: any) => a && a.address)
      .slice(0, ADDRESSES_PER_COLLECTION)
      .map((a: any) => ({
        address: String(a.address),
        label: a.label || "",
        entity: a.entity || "",
        network: a.network
          ? {
              id: String(a.network.id || ""),
              name: a.network.name || "",
              shortName: a.network.shortName || "",
              slug: a.network.slug || "",
            }
          : null,
      }));
  } catch (err) {
    console.error(`fetchCollectionAddresses(${id}) failed`, err);
    return [];
  }
}

// Module-level cache so the directory is fetched once per build even though
// several route files call into it from their getStaticPaths().
let cache: Promise<DirectoryEntry[]> | null = null;

export function getDirectory(): Promise<DirectoryEntry[]> {
  if (!cache) {
    cache = (async () => {
      const collections = await fetchPublicCollections();
      const entries = await Promise.all(
        collections.map(async (collection) => {
          const addresses = await fetchCollectionAddresses(collection.id);
          const totalPages = Math.max(1, Math.ceil(addresses.length / PAGE_SIZE));
          return { collection, addresses, totalPages } satisfies DirectoryEntry;
        }),
      );
      // Drop collections that returned no visible addresses — an empty table
      // is not worth an indexable page.
      return entries.filter((e) => e.addresses.length > 0);
    })();
  }
  return cache;
}

// Canonical path for a collection's directory page. Page 1 lives at the base
// path (no trailing page segment) to keep the primary URL clean for SEO.
export function collectionPath(slug: string, page = 1): string {
  return page <= 1 ? `/directory/${slug}/` : `/directory/${slug}/${page}/`;
}

// Serialize a JSON-LD object for safe embedding in an inline
// <script type="application/ld+json"> tag. JSON.stringify does not escape
// `<`, so a label containing `</script>` would otherwise break out of the tag.
export function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function addressesForPage(
  addresses: DirectoryAddress[],
  page: number,
): DirectoryAddress[] {
  const start = (page - 1) * PAGE_SIZE;
  return addresses.slice(start, start + PAGE_SIZE);
}
