import { createFileRoute } from "@tanstack/react-router";

import { ResetPasswordPage } from "@/features/real-estate/components/AuthPages";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password | Lineage Properties Pvt Ltd" },
      { name: "description", content: "Set a new password for your Lineage Properties Pvt Ltd staff account." },
      { property: "og:title", content: "Reset password | Lineage Properties Pvt Ltd" },
      { property: "og:description", content: "Set a new password for your Lineage Properties Pvt Ltd staff account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});