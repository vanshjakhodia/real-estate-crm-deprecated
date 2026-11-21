import { createFileRoute } from "@tanstack/react-router";

import { KanpurMarketMapPage } from "@/features/real-estate/pages/KanpurMarketMapPage";

export const Route = createFileRoute("/_authenticated/market-map")({
  head: () => ({
    meta: [
      { title: "Kanpur market map | Lineage Properties Pvt Ltd" },
      { name: "description", content: "Explore the Kanpur locality guide and property market information." },
      { property: "og:title", content: "Kanpur market map | Lineage Properties Pvt Ltd" },
      { property: "og:description", content: "Explore the Kanpur locality guide and property market information." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: KanpurMarketMapPage,
});