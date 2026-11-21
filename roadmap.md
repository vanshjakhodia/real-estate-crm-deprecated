# Migration roadmap

- [x] Recreate the public showcase, appointment booking, CRM pages, market map, follow-ups, settings and Excel workflows.
- [x] Keep Gemini assistant features disabled per the user's choice; do not request or store a Google API key unless they ask to re-enable it.
- [x] Move the schema, roles, access rules and staff sign-in to Lovable Cloud; replace the fake PIN and local role simulation.
- [x] Add page metadata and focused tests; verify public pages and booking, including removal of the temporary test record.
- [ ] Verify signed-in staff access and CRM changes with an authorized staff session; temporary test-account creation was declined.
- [ ] Import existing records and users after exports are supplied; the preview currently has no existing CRM rows.
- [ ] Complete production cutover after existing records and users are imported and signed-in staff access is verified; AI remains off by user choice.