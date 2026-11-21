import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { LeadDetailPage } from "@/features/real-estate/pages/LeadDetailPage";

export const Route = createFileRoute("/_authenticated/lead/$leadId")({
  head: () => ({
    meta: [
      { title: "Client record | Lineage Properties Pvt Ltd" },
      { name: "description", content: "Review a client’s contact details, inquiry, messages and appointments." },
      { property: "og:title", content: "Client record | Lineage Properties Pvt Ltd" },
      { property: "og:description", content: "Review a client’s contact details, inquiry, messages and appointments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LeadDetailRoute,
});

function LeadDetailRoute() {
  const { leadId } = Route.useParams();
  const navigate = useNavigate();
  return (
    <LeadDetailPage
      leadId={leadId}
      onBack={() => void navigate({ to: "/leads", search: { score: undefined, status: undefined, add: undefined } })}
      onNavigateAppointments={() => void navigate({ to: "/appointments" })}
      onBackToDashboard={() => void navigate({ to: "/admin" })}
    />
  );
}