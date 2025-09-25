// app/api/placeholder/route.ts
// Node runtime so we can touch the filesystem if we want to.
export const runtime = "nodejs";

import { promises as fs } from "fs";
import path from "path";

function sanitize(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .slice(0, 60);
}

function makeSvg(opts: { text: string; w: number; h: number }) {
  const { text, w, h } = opts;
  const bg = "#EEE";
  const fg = "#555";
  const fontSize = Math.max(12, Math.min(w, h) / 8);

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <rect width="100%" height="100%" fill="${bg}"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        font-family="system-ui, -apple-system, Segoe UI, Roboto, Arial"
        font-size="${fontSize}" fill="${fg}">
    ${sanitize(text)}
  </text>
</svg>`.trim();
}

async function readStaticFallback() {
  const p = path.join(process.cwd(), "public", "img", "placeholder-part.svg");
  return fs.readFile(p);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // If someone explicitly asks for the static image:
  const staticMode = searchParams.get("static") === "1";

  // Params for generated SVG
  const text = searchParams.get("text") || "No Image";
  const w = Math.max(32, Math.min(1024, Number(searchParams.get("w") || 150)));
  const h = Math.max(32, Math.min(1024, Number(searchParams.get("h") || 150)));

  try {
    if (staticMode) {
      const buf = await readStaticFallback();
      return new Response(buf, {
        headers: {
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    const svg = makeSvg({ text, w, h });
    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    // Last resort: try disk fallback; if that fails, return a tiny inline SVG
    try {
      const buf = await readStaticFallback();
      return new Response(buf, {
        headers: {
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch {
      const svg = makeSvg({ text: "No Image", w: 150, h: 150 });
      return new Response(svg, {
        headers: { "Content-Type": "image/svg+xml; charset=utf-8" },
      });
    }
  }
}
