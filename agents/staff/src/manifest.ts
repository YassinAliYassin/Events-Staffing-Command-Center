import type { AgentManifest } from "./types.js";

export const manifest: AgentManifest = {
  "id": "staff",
  "name": "Staff Agent",
  "company": "ESCC",
  "section": "roster",
  "version": "1.1.0",
  "description": "Staff roster, roles, PIN auth, and talent registry",
  "accent": "#3B82F6",
  "capabilities": [
    "staff.list",
    "staff.create",
    "staff.update",
    "staff.remove"
  ],
  "repo": "https://github.com/YassinAliYassin/escc-staff-agent",
  "entry": "./src/index.ts",
  "ui": {
    "tabKey": "roster",
    "tabLabel": "Roster",
    "icon": "users"
  },
  "dependsOn": []
} as AgentManifest;
