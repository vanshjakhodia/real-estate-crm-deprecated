import { createFileRoute } from "@tanstack/react-router";

import { AuthCallbackPage } from "@/features/real-estate/components/AuthPages";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [
      { title: "Completing sign in | Lineage Properties Pvt Ltd" },
      { name: "description", content: "Completing administrator sign-in for Lineage Properties Pvt Ltd." },
      { property: "og:title", content: "Completing sign in | Lineage Properties Pvt Ltd" },
      { property: "og:description", content: "Completing administrator sign-in for Lineage Properties Pvt Ltd." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthCallbackPage,
});