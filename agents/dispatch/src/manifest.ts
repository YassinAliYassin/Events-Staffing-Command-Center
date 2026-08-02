import type { AgentManifest } from "@escc/core";

export const manifest: AgentManifest = {
  "id": "dispatch",
  "name": "Dispatch Agent",
  "company": "ESCC",
  "section": "whatsapp",
  "version": "1.1.0",
  "description": "WhatsApp staff dispatch, webhooks, and field notifications",
  "accent": "#22C55E",
  "capabilities": [
    "dispatch.event",
    "dispatch.bulk",
    "whatsapp.webhook",
    "whatsapp.health"
  ],
  "repo": "https://github.com/YassinAliYassin/escc-dispatch-agent",
  "entry": "./src/index.ts",
  "ui": {
    "tabKey": "whatsapp",
    "tabLabel": "Dispatch",
    "icon": "send"
  },
  "dependsOn": [
    "staff",
    "calendar"
  ]
} as AgentManifest;
