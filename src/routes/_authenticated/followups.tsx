import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { FollowupsPage } from "@/features/real-estate/pages/FollowupsPage";

export const Route = createFileRoute("/_authenticated/followups")({
  head: () => ({
    meta: [
      { title: "Client follow-ups | Lineage Properties Pvt Ltd" },
      { name: "description", content: "Review pending and overdue client follow-ups and appointment reminders." },
      { property: "og:title", content: "Client follow-ups | Lineage Properties Pvt Ltd" },
      { property: "og:description", content: "Review pending and overdue client follow-ups and appointment reminders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FollowupsRoute,
});

function FollowupsRoute() {
  const navigate = useNavigate();
  return <FollowupsPage onSelectLead={(leadId) => void navigate({ to: "/lead/$leadId", params: { leadId } })} />;
}