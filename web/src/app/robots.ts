import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/utils";
import { AI_SEARCH_AGENTS, AI_TRAINING_AGENTS } from "@/lib/constants";

const DISALLOW = ["/admin/", "/api/"];

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      ...AI_SEARCH_AGENTS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: DISALLOW,
      })),
      ...AI_TRAINING_AGENTS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: DISALLOW,
      })),
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
