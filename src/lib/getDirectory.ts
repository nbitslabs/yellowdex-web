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

// Cap on address requests in flight at once. Firing all collections'
// requests concurrently overwhelms the public API — under that load it
// returns 502 at its gateway timeout, those collections fetch no addresses,
// and getDirectory() drops them (or, if enough fail at once, renders the
// whole directory as "unavailable"). A small pool keeps each request fast.
const FETCH_CONCURRENCY = 4;
// Per-request timeout so a single hung request can't stall the build. Undici's
// default is 300s; with retries that is minutes of dead time per collection.
const FETCH_TIMEOUT_MS = 20_000;
// Retries for transient failures (5xx / network / timeout) before giving up.
const FETCH_RETRIES = 2;

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Fetch with a timeout and bounded retries on transient failures. A 5xx
// response, a network error, or a timeout is retried with linear backoff;
// a 4xx (client) response is returned as-is (retrying won't help). Returns
// null only when every attempt failed.
async function fetchWithRetry(url: string): Promise<Response | null> {
  for (let attempt = 0; attempt <= FETCH_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (res.ok || res.status < 500) return res;
      // 5xx — fall through to retry.
    } catch {
      // Network error or timeout — fall through to retry.
    }
    if (attempt < FETCH_RETRIES) await sleep(500 * (attempt + 1));
  }
  return null;
}

// Map over items with a bounded number of workers, preserving input order.
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (true) {
      const index = next++;
      if (index >= items.length) return;
      results[index] = await fn(items[index], index);
    }
  };
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    worker,
  );
  await Promise.all(workers);
  return results;
}

async function fetchPublicCollections(): Promise<DirectoryCollection[]> {
  try {
    const res = await fetchWithRetry(
      `${API_BASE}/public/owners/${encodeURIComponent(OWNER_HANDLE)}/collections`,
    );
    if (!res || !res.ok) return [];

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
    const res = await fetchWithRetry(
      `${API_BASE}/collections/${encodeURIComponent(id)}/addresses/page?limit=${ADDRESSES_PER_COLLECTION}`,
    );
    if (!res || !res.ok) return [];

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
      // Bounded concurrency: fetching all collections' addresses at once
      // overwhelms the API (see FETCH_CONCURRENCY). Order is preserved.
      const entries = await mapWithConcurrency(
        collections,
        FETCH_CONCURRENCY,
        async (collection) => {
          const addresses = await fetchCollectionAddresses(collection.id);
          const totalPages = Math.max(1, Math.ceil(addresses.length / PAGE_SIZE));
          return { collection, addresses, totalPages } satisfies DirectoryEntry;
        },
      );
      // Drop collections that returned no visible addresses — an empty table
      // is not worth an indexable page. Warn so a build that silently loses a
      // collection to a fetch failure is visible in the logs (rather than the
      // collection just vanishing from the directory).
      const dropped = entries
        .filter((e) => e.addresses.length === 0)
        .map((e) => e.collection.slug);
      if (dropped.length > 0) {
        console.warn(
          `getDirectory: ${dropped.length} collection(s) returned no addresses and were dropped: ${dropped.join(", ")}`,
        );
      }
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
