import { createFileRoute } from "@tanstack/react-router";

import { SettingsPage } from "@/features/real-estate/pages/SettingsPage";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Firm settings | Lineage Properties Pvt Ltd" },
      { name: "description", content: "Manage appointment hours, communication preferences and staff access." },
      { property: "og:title", content: "Firm settings | Lineage Properties Pvt Ltd" },
      { property: "og:description", content: "Manage appointment hours, communication preferences and staff access." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});