import { createFileRoute } from "@tanstack/react-router";

import { AuthPage } from "@/features/real-estate/components/AuthPages";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Admin Portal Sign In | Lineage Properties Pvt Ltd" },
      { name: "description", content: "Direct administrator sign-in for Lineage Properties Pvt Ltd." },
      { property: "og:title", content: "Admin Portal Sign In | Lineage Properties Pvt Ltd" },
      { property: "og:description", content: "Direct administrator sign-in for Lineage Properties Pvt Ltd." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});