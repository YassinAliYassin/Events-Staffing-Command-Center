import type { AgentManifest } from "@escc/core";

export const manifest: AgentManifest = {
  "id": "billing",
  "name": "Billing Agent",
  "company": "ESCC",
  "section": "documents",
  "version": "1.1.0",
  "description": "Quotes, invoices, statements, and tax-aware billing",
  "accent": "#F59E0B",
  "capabilities": [
    "quote.create",
    "invoice.create",
    "invoice.list",
    "invoice.markPaid",
    "statement.summary"
  ],
  "repo": "https://github.com/YassinAliYassin/escc-billing-agent",
  "entry": "./src/index.ts",
  "ui": {
    "tabKey": "documents",
    "tabLabel": "Docs & Billing",
    "icon": "file-text"
  },
  "dependsOn": [
    "crm",
    "calendar"
  ]
} as AgentManifest;
