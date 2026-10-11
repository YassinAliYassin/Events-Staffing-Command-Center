import type { AgentManifest } from "@escc/core";

export const manifest: AgentManifest = {
  "id": "dispatch",
  "name": "Dispatch Agent",
  "company": "ESCC",
  "section": "dispatch",
  "version": "1.2.0",
  "description": "On-site run sheets and crew briefings",
  "accent": "#22C55E",
  "capabilities": [
    "dispatch.event",
    "dispatch.bulk",
    "dispatch.runsheet"
  ],
  "repo": "https://github.com/YassinAliYassin/escc-dispatch-agent",
  "entry": "./src/index.ts",
  "ui": {
    "tabKey": "dispatch",
    "tabLabel": "Dispatch",
    "icon": "send"
  },
  "dependsOn": [
    "staff",
    "calendar"
  ]
} as AgentManifest;
