import type { APIRoute } from "astro";

const SPEC_URL = "https://sync.yellowdex.ai/api/v1/openapi.json";

interface SwaggerSchema {
  $ref?: string;
  type?: string;
  format?: string;
  items?: SwaggerSchema;
  additionalProperties?: SwaggerSchema | boolean;
  enum?: unknown[];
  description?: string;
  properties?: Record<string, SwaggerSchema>;
  required?: string[];
}

interface SwaggerParameter {
  name: string;
  in: string;
  type?: string;
  format?: string;
  required?: boolean;
  description?: string;
  schema?: SwaggerSchema;
  enum?: unknown[];
  items?: SwaggerSchema;
}

interface SwaggerOperation {
  summary?: string;
  description?: string;
  parameters?: SwaggerParameter[];
  responses?: Record<string, { description?: string; schema?: SwaggerSchema }>;
  security?: Record<string, unknown>[];
  deprecated?: boolean;
}

const HTTP_METHODS = ["get", "post", "put", "patch", "delete", "head", "options"];

export const GET: APIRoute = async () => {
  let content: string;
  try {
    const res = await fetch(SPEC_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const spec = await res.json();
    content = specToMarkdown(spec);
  } catch (err) {
    console.error("api-docs.md generation failed", err);
    content = `# Yellowdex Public API

The API reference could not be generated at build time.

- Machine-readable spec (Swagger 2.0): ${SPEC_URL}
- Interactive docs: https://yellowdex.ai/api-docs/
`;
  }

  return new Response(content, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
};

function specToMarkdown(spec: any): string {
  const info = spec.info ?? {};
  const baseUrl = `https://${spec.host ?? "sync.yellowdex.ai"}${spec.basePath ?? ""}`;
  const lines: string[] = [];

  lines.push(`# ${info.title ?? "Yellowdex Public API"}`);
  lines.push("");
  if (info.description) lines.push(oneParagraph(info.description), "");
  lines.push(`- Version: ${info.version ?? "unknown"}`);
  lines.push(`- Base URL: ${baseUrl}`);
  lines.push(`- Machine-readable spec (Swagger 2.0): ${SPEC_URL}`);
  lines.push(`- Interactive docs: https://yellowdex.ai/api-docs/`);
  if (info.contact?.email) lines.push(`- Support: ${info.contact.email}`);
  lines.push("");

  const securityDefs = spec.securityDefinitions ?? {};
  if (Object.keys(securityDefs).length > 0) {
    lines.push("## Authentication", "");
    for (const [name, def] of Object.entries<any>(securityDefs)) {
      lines.push(
        `- **${name}** (${def.type}, ${def.in} \`${def.name}\`)${def.description ? ` — ${oneLine(def.description)}` : ""}`
      );
    }
    lines.push("");
  }

  lines.push("## Endpoints", "");
  for (const [path, pathItem] of Object.entries<any>(spec.paths ?? {})) {
    for (const method of HTTP_METHODS) {
      const op: SwaggerOperation | undefined = pathItem[method];
      if (!op) continue;
      lines.push(`### ${method.toUpperCase()} ${path}`, "");
      if (op.deprecated) lines.push("**Deprecated.**", "");
      if (op.summary) lines.push(oneParagraph(op.summary), "");
      if (op.description && op.description !== op.summary) lines.push(oneParagraph(op.description), "");
      if (op.security && op.security.length > 0) {
        const schemes = op.security.flatMap((s) => Object.keys(s)).join(", ");
        lines.push(`Auth required: ${schemes}`, "");
      }

      const params = op.parameters ?? [];
      if (params.length > 0) {
        lines.push("| Parameter | In | Type | Required | Description |");
        lines.push("| --- | --- | --- | --- | --- |");
        for (const p of params) {
          const type = p.schema ? schemaType(p.schema) : paramType(p);
          lines.push(
            `| ${cell(p.name)} | ${p.in} | ${cell(type)} | ${p.required ? "yes" : "no"} | ${cell(p.description ?? "")} |`
          );
        }
        lines.push("");
      }

      const responses = Object.entries(op.responses ?? {});
      if (responses.length > 0) {
        lines.push("Responses:", "");
        for (const [code, r] of responses) {
          const schema = r.schema ? ` — returns ${schemaType(r.schema)}` : "";
          lines.push(`- \`${code}\`${r.description ? ` ${oneLine(r.description)}` : ""}${schema}`);
        }
        lines.push("");
      }
    }
  }

  const definitions = Object.entries<any>(spec.definitions ?? {});
  if (definitions.length > 0) {
    lines.push("## Models", "");
    for (const [name, def] of definitions) {
      lines.push(`### ${name}`, "");
      if (def.description) lines.push(oneParagraph(def.description), "");
      const props = Object.entries<SwaggerSchema>(def.properties ?? {});
      if (props.length > 0) {
        const required = new Set(def.required ?? []);
        lines.push("| Field | Type | Required | Description |");
        lines.push("| --- | --- | --- | --- |");
        for (const [field, schema] of props) {
          const enumNote = schema.enum ? ` One of: ${schema.enum.map((v) => `\`${v}\``).join(", ")}.` : "";
          lines.push(
            `| ${cell(field)} | ${cell(schemaType(schema))} | ${required.has(field) ? "yes" : "no"} | ${cell((schema.description ?? "") + enumNote)} |`
          );
        }
        lines.push("");
      } else {
        lines.push(`Type: ${schemaType(def)}`, "");
      }
    }
  }

  return lines.join("\n");
}

function schemaType(schema: SwaggerSchema | undefined): string {
  if (!schema) return "unknown";
  if (schema.$ref) return refName(schema.$ref);
  if (schema.type === "array") return `${schemaType(schema.items)}[]`;
  if (schema.type === "object" && schema.additionalProperties && typeof schema.additionalProperties === "object") {
    return `map<string, ${schemaType(schema.additionalProperties)}>`;
  }
  if (schema.type && schema.format) return `${schema.type} (${schema.format})`;
  return schema.type ?? "object";
}

function paramType(p: SwaggerParameter): string {
  if (p.type === "array") return `${schemaType(p.items)}[]`;
  const base = p.format ? `${p.type} (${p.format})` : (p.type ?? "string");
  return p.enum ? `${base}: ${p.enum.map((v) => `\`${v}\``).join(" \\| ")}` : base;
}

function refName(ref: string): string {
  return ref.replace(/^#\/definitions\//, "");
}

function oneLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function oneParagraph(text: string): string {
  return text.replace(/[ \t]*\n[ \t]*/g, " ").trim();
}

function cell(text: string): string {
  return oneLine(text).replace(/\|/g, "\\|");
}
