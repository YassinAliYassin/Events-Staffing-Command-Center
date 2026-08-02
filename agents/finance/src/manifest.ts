import type { AgentManifest } from "@escc/core";

export const manifest: AgentManifest = {
  "id": "finance",
  "name": "Finance Agent",
  "company": "ESCC",
  "section": "payroll",
  "version": "1.1.0",
  "description": "Payroll, payments status, staff earnings, and finance alerts",
  "accent": "#D4A853",
  "capabilities": [
    "payroll.summary",
    "payment.remind",
    "payroll.export"
  ],
  "repo": "https://github.com/YassinAliYassin/escc-finance-agent",
  "entry": "./src/index.ts",
  "ui": {
    "tabKey": "payroll",
    "tabLabel": "Payroll",
    "icon": "wallet"
  },
  "dependsOn": [
    "staff",
    "timesheet"
  ]
} as AgentManifest;
