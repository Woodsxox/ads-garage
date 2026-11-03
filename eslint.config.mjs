import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const LIVE_AD_MESSAGE =
  "Live ad components are only for the files listed in scripts/check-ad-isolation.mjs. Demos, the sandbox, the studio and lessons use demo ads only.";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["**/RealAd", "**/SponsoredSlot", "**/AdSenseLoader"], message: LIVE_AD_MESSAGE },
          ],
        },
      ],
    },
  },
  {
    // The only files that may import the live-ad components (keep in sync with the check script).
    files: [
      "components/editorial/EditorialArticle.tsx",
      "components/ads/SponsoredSlot.tsx",
      "app/page.tsx",
      "app/gallery/page.tsx",
      "app/layout.tsx",
    ],
    rules: { "no-restricted-imports": "off" },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "ads-backend/**"]),
]);

export default eslintConfig;
