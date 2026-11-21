import { createFileRoute } from "@tanstack/react-router";

import { CrmProvider } from "@/features/real-estate/context/CrmContext";
import { PublicBookingRoutePage } from "@/features/real-estate/pages/PublicBookingRoutePage";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Book a property visit | Lineage Properties Pvt Ltd" },
      { name: "description", content: "Choose an available time for a Kanpur property visit or private consultation." },
      { property: "og:title", content: "Book a property visit | Lineage Properties Pvt Ltd" },
      { property: "og:description", content: "Choose an available time for a Kanpur property visit or private consultation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BookPage,
});

function BookPage() {
  return (
    <CrmProvider publicMode>
      <PublicBookingRoutePage />
    </CrmProvider>
  );
}