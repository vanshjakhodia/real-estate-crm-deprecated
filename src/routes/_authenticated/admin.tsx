import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { DashboardPage } from "@/features/real-estate/pages/DashboardPage";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Staff dashboard | Lineage Properties Pvt Ltd" },
      { name: "description", content: "Review Lineage Properties Pvt Ltd client activity, appointments and property portfolio." },
      { property: "og:title", content: "Staff dashboard | Lineage Properties Pvt Ltd" },
      { property: "og:description", content: "Review Lineage Properties Pvt Ltd client activity, appointments and property portfolio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardRoute,
});

function DashboardRoute() {
  const navigate = useNavigate();
  return (
    <DashboardPage
      onNavigate={(tab, filter) => {
        if (tab === "leads") {
          void navigate({ to: "/leads", search: { score: filter?.score, status: filter?.status, add: undefined } });
        } else if (tab === "appointments") {
          void navigate({ to: "/appointments" });
        } else if (tab === "followups") {
          void navigate({ to: "/followups" });
        }
      }}
      onOpenAddLead={() => void navigate({ to: "/leads", search: { score: undefined, status: undefined, add: true } })}
      onSelectLead={(leadId) => void navigate({ to: "/lead/$leadId", params: { leadId } })}
    />
  );
}