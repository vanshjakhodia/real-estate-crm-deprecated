import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { LeadsPage } from "@/features/real-estate/pages/LeadsPage";

export const Route = createFileRoute("/_authenticated/leads")({
  validateSearch: (search: Record<string, unknown>) => ({
    score: typeof search["score"] === "string" ? search["score"] : undefined,
    status: typeof search["status"] === "string" ? search["status"] : undefined,
    add: search["add"] === true || search["add"] === "true" ? true : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Client registry | Lineage Properties Pvt Ltd" },
      { name: "description", content: "Manage client inquiries, contact details, budgets and follow-up stages." },
      { property: "og:title", content: "Client registry | Lineage Properties Pvt Ltd" },
      { property: "og:description", content: "Manage client inquiries, contact details, budgets and follow-up stages." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LeadsRoute,
});

function LeadsRoute() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  return (
    <LeadsPage
      initialFilter={search}
      onSelectLead={(leadId) => void navigate({ to: "/lead/$leadId", params: { leadId } })}
    />
  );
}