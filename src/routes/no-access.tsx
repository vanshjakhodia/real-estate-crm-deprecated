import { createFileRoute } from "@tanstack/react-router";

import { NoAccessPage } from "@/features/real-estate/components/AuthPages";

export const Route = createFileRoute("/no-access")({
  head: () => ({
    meta: [
      { title: "Staff access needed | Lineage Properties Pvt Ltd" },
      { name: "description", content: "This signed-in account has not been assigned Lineage Properties CRM access." },
      { property: "og:title", content: "Staff access needed | Lineage Properties Pvt Ltd" },
      { property: "og:description", content: "This signed-in account has not been assigned Lineage Properties CRM access." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NoAccessPage,
});