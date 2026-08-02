import type { AgentManifest } from "@escc/core";

export const manifest: AgentManifest = {
  "id": "calendar",
  "name": "Calendar Agent",
  "company": "ESCC",
  "section": "calendar",
  "version": "1.1.0",
  "description": "Event scheduling, Apple/Google calendar sync, conflict detection",
  "accent": "#8B5CF6",
  "capabilities": [
    "event.list",
    "event.create",
    "event.update",
    "calendar.sync.apple",
    "calendar.sync.google"
  ],
  "repo": "https://github.com/YassinAliYassin/escc-calendar-agent",
  "entry": "./src/index.ts",
  "ui": {
    "tabKey": "calendar",
    "tabLabel": "Calendar",
    "icon": "calendar"
  },
  "dependsOn": [
    "staff",
    "crm"
  ]
} as AgentManifest;
