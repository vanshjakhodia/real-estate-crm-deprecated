import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { PublicShowcasePage } from "@/features/real-estate/pages/PublicShowcasePage";
import { CrmProvider } from "@/features/real-estate/context/CrmContext";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lineage Properties CRM | Curated Estates & Private Advisory" },
      { name: "description", content: "Curated Estates & Prime Acquisitions in Kanpur. Fiduciary property advisory." },
      { property: "og:title", content: "Lineage Properties CRM | Curated Estates & Private Advisory" },
      { property: "og:description", content: "Curated Estates & Prime Acquisitions in Kanpur. Fiduciary property advisory." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IndexPage,
});

function IndexPage() {
  const navigate = useNavigate();
  return (
    <CrmProvider publicMode>
      <PublicShowcasePage onOpenCrm={() => void navigate({ to: "/admin" })} />
    </CrmProvider>
  );
}
