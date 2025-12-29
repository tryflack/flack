import { auth } from "@flack/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export interface LinkPreviewData {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  favicon: string | null;
}

// Simple HTML entity decoder
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&nbsp;/g, " ");
}

// Extract meta tag content using regex (works for SSR-rendered pages)
function extractMetaContent(html: string, property: string): string | null {
  // Try property first (og:*, twitter:*)
  const propertyRegex = new RegExp(
    `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  let match = html.match(propertyRegex);
  if (match) return decodeHtmlEntities(match[1]);

  // Try reversed order (content before property)
  const reversedRegex = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`,
    "i",
  );
  match = html.match(reversedRegex);
  if (match) return decodeHtmlEntities(match[1]);

  // Try name attribute (for twitter:* fallbacks and standard meta)
  const nameRegex = new RegExp(
    `<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  match = html.match(nameRegex);
  if (match) return decodeHtmlEntities(match[1]);

  // Reversed name order
  const reversedNameRegex = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`,
    "i",
  );
  match = html.match(reversedNameRegex);
  if (match) return decodeHtmlEntities(match[1]);

  return null;
}

// Extract title from <title> tag
function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? decodeHtmlEntities(match[1].trim()) : null;
}

// Extract favicon
function extractFavicon(html: string, baseUrl: string): string | null {
  // Try to find link rel="icon" or rel="shortcut icon"
  const iconRegex =
    /<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i;
  let match = html.match(iconRegex);
  if (!match) {
    // Try reversed order
    const reversedRegex =
      /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/i;
    match = html.match(reversedRegex);
  }

  if (match) {
    const href = match[1];
    // Convert relative URL to absolute
    if (href.startsWith("http")) return href;
    if (href.startsWith("//")) return `https:${href}`;
    if (href.startsWith("/")) return `${new URL(baseUrl).origin}${href}`;
    return `${new URL(baseUrl).origin}/${href}`;
  }

  // Fallback to /favicon.ico
  try {
    return `${new URL(baseUrl).origin}/favicon.ico`;
  } catch {
    return null;
  }
}

// Resolve relative URLs to absolute
function resolveUrl(url: string | null, baseUrl: string): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) {
    try {
      return `${new URL(baseUrl).origin}${url}`;
    } catch {
      return url;
    }
  }
  return url;
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  // Validate URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        { error: "Invalid URL protocol" },
        { status: 400 },
      );
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Flack/1.0; +https://flack.app)",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch URL" },
        { status: 502 },
      );
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return NextResponse.json(
        { error: "URL is not an HTML page" },
        { status: 400 },
      );
    }

    const html = await response.text();

    // Extract OG metadata
    const preview: LinkPreviewData = {
      url,
      title:
        extractMetaContent(html, "og:title") ||
        extractMetaContent(html, "twitter:title") ||
        extractTitle(html),
      description:
        extractMetaContent(html, "og:description") ||
        extractMetaContent(html, "twitter:description") ||
        extractMetaContent(html, "description"),
      image: resolveUrl(
        extractMetaContent(html, "og:image") ||
          extractMetaContent(html, "twitter:image"),
        url,
      ),
      siteName:
        extractMetaContent(html, "og:site_name") ||
        parsedUrl.hostname.replace("www.", ""),
      favicon: extractFavicon(html, url),
    };

    // Return with cache headers (cache for 1 hour)
    return NextResponse.json(preview, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "Request timeout" }, { status: 504 });
    }
    console.error("Link preview error:", error);
    return NextResponse.json(
      { error: "Failed to fetch preview" },
      { status: 500 },
    );
  }
}
