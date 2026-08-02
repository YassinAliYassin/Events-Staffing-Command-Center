import type { AgentManifest } from "@escc/core";

export const manifest: AgentManifest = {
  "id": "timesheet",
  "name": "Timesheet Agent",
  "company": "ESCC",
  "section": "timesheets",
  "version": "1.1.0",
  "description": "Clock in/out, shift history, and timesheet export",
  "accent": "#10B981",
  "capabilities": [
    "clock.in",
    "clock.out",
    "timesheet.list",
    "timesheet.export"
  ],
  "repo": "https://github.com/YassinAliYassin/escc-timesheet-agent",
  "entry": "./src/index.ts",
  "ui": {
    "tabKey": "timesheets",
    "tabLabel": "Timesheets",
    "icon": "clock"
  },
  "dependsOn": [
    "staff"
  ]
} as AgentManifest;
