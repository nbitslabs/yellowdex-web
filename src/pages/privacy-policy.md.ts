import type { APIRoute } from "astro";

export const GET: APIRoute = () => {
  const content = `# Privacy Policy

Effective date: March 9, 2026

Yellowdex is operated by **NBITS PTE LTD**, a company registered in Singapore.

## 1. What Yellowdex Does

Yellowdex is a Chrome extension that detects cryptocurrency addresses on web pages you visit and lets you label, organize, and share them. It works entirely within your browser and stores data locally unless you choose to sync.

## 2. Information We Collect

### Stored locally on your device

- Address labels, entities, tags, notes, and collections you create
- Extension preferences and settings

### Sent to our server only if you enable sync

- Your Ethereum wallet address (used for authentication via wallet signature)
- Address labels, entities, and collection data you choose to sync

### What we do NOT collect

- Browsing history or the URLs you visit
- Page content beyond detected cryptocurrency addresses
- Wallet private keys, seed phrases, or balances
- Personal information beyond your wallet address (if sync is enabled)
- Analytics, telemetry, or usage tracking data

## 3. How We Use Your Information

- To display your labels on web pages you visit
- To sync your data across devices when you opt in
- To enable shared collections with other users

We do not sell, rent, or share your data with third parties for advertising or marketing purposes.

## 4. Content Script Behavior

### What the content script does

- Scans text nodes and links on the current page to detect Ethereum-style addresses (0x...)
- Wraps detected addresses with interactive labels you have saved
- Uses a MutationObserver to handle dynamically loaded content

### What it does NOT do

- Read or transmit page content, cookies, or credentials
- Inject advertisements or third-party tracking scripts
- Modify form inputs, intercept transactions, or alter blockchain interactions
- Execute any remote code

## 5. Data Storage and Security

Label data is stored locally using Chrome's storage API (\`chrome.storage.local\`). When sync is enabled, a copy of your data is also stored on our server at **sync.yellowdex.ai**, transmitted over HTTPS. Authentication is handled by signing a message with your Ethereum wallet (EIP-712). We do not store passwords or private keys.

## 6. Third-Party Services

Yellowdex loads **Font Awesome** icons from a CDN (\`cdnjs.cloudflare.com\`) for UI elements. This is the only external resource loaded by the extension beyond our own sync server. No data is sent to Font Awesome or Cloudflare.

## 7. Shared Collections

When you share a collection, a read-only link is generated. Anyone with the link can import the collection's entities and address labels. Shared collection data is stored on our sync server. You can revoke a share link at any time, which prevents further imports.

## 8. Data Retention and Deletion

- **Local data:** Persists until you uninstall the extension or clear Chrome storage.
- **Synced data:** Persists on our server until you delete it from the extension or request deletion by contacting us.
- **Account deletion:** Email support@yellowdex.ai and we will delete all server-side data associated with your account within 30 days.

## 9. Your Rights

You have the right to:

- Access and export all of your data (via the extension's JSON export)
- Delete your data at any time (locally or by requesting server-side deletion)
- Withdraw consent for sync (disable it in extension settings)
- Revoke shared collection links

If you are located in the EU/EEA, you may also exercise rights under the GDPR, including the right to data portability, rectification, and the right to lodge a complaint with your local data protection authority.

## 10. Children's Privacy

Yellowdex is not directed at children under the age of 13. We do not knowingly collect personal information from children. If we become aware that a child has provided us with personal data, we will delete it promptly.

## 11. International Data Transfers

If you enable sync, your data may be processed on servers located outside your country of residence. We take reasonable measures to protect your data in accordance with this policy regardless of where it is processed.

## 12. Chrome Web Store Disclosures

In accordance with the Chrome Web Store Developer Program Policies:

- The \`activeTab\` permission is limited to detecting cryptocurrency addresses on the current page when the extension is active.
- The \`storage\` permission is used solely to persist user-created labels and settings.
- The \`identity\` permission is used only to open a secure authentication popup for wallet-based login to enable cross-device sync.
- The \`notifications\` permission is used only to alert you when a shared collection has been imported.
- Host permissions for \`sync.yellowdex.ai\` are used exclusively to communicate with our sync server.
- Content scripts run on all URLs solely to identify cryptocurrency addresses for local labeling; no page content is collected or transmitted to any external server.

## 13. Changes to This Policy

We may update this privacy policy from time to time. Changes will be posted on this page with an updated effective date. Continued use of the extension after changes constitutes acceptance of the revised policy.

## 14. Contact Us

support@yellowdex.ai
`;

  return new Response(content, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
};
