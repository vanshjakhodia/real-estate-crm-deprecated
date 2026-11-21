import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { AppointmentsPage } from "@/features/real-estate/pages/AppointmentsPage";

export const Route = createFileRoute("/_authenticated/appointments")({
  head: () => ({
    meta: [
      { title: "Appointments | Lineage Properties Pvt Ltd" },
      { name: "description", content: "Review and manage property visits and client consultations." },
      { property: "og:title", content: "Appointments | Lineage Properties Pvt Ltd" },
      { property: "og:description", content: "Review and manage property visits and client consultations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AppointmentsRoute,
});

function AppointmentsRoute() {
  const navigate = useNavigate();
  return <AppointmentsPage onSelectLead={(leadId) => void navigate({ to: "/lead/$leadId", params: { leadId } })} />;
}