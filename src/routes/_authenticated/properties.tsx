import { createFileRoute } from "@tanstack/react-router";

import { PropertiesPage } from "@/features/real-estate/pages/PropertiesPage";

export const Route = createFileRoute("/_authenticated/properties")({
  head: () => ({
    meta: [
      { title: "Property portfolio | Lineage Properties Pvt Ltd" },
      { name: "description", content: "Maintain property details, price ranges, RERA references and availability." },
      { property: "og:title", content: "Property portfolio | Lineage Properties Pvt Ltd" },
      { property: "og:description", content: "Maintain property details, price ranges, RERA references and availability." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PropertiesPage,
});