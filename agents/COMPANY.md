# ESCC Company

**Events Staffing Command Center** is the product line. **ESCC** is the company namespace that owns the agents, shell, and ops.

## Mission

Run event staffing operations end-to-end: hire and roster talent, schedule events, clock hours, bill clients, pay staff, and dispatch field teams — with specialized AI-ready agents for each domain.

## Org layout (GitHub)

```
ESCC (company / future GitHub Organization)
├── Project: ESCC (single board for all agents)
├── escc                          ← this hub
├── Events-Staffing-Command-Center ← shell UI + API
├── escc-executive-agent
├── escc-staff-agent
├── escc-timesheet-agent
├── escc-calendar-agent
├── escc-billing-agent
├── escc-crm-agent
├── escc-finance-agent
└── escc-dispatch-agent
```

Until the GitHub Organization `ESCC` is created, repositories live under `@YassinAliYassin` with the `escc` prefix and company project board.

## Ownership matrix

| Domain | Agent owner | Primary consumers |
|--------|-------------|-------------------|
| Executive KPIs | executive | leadership |
| Talent roster | staff | ops managers |
| Hours & attendance | timesheet | finance, staff |
| Events & venues | calendar | ops, dispatch |
| Commercial docs | billing | sales, finance |
| Relationships | crm | sales |
| Pay & cash | finance | finance, staff |
| Field notify | dispatch | ops, staff phones |
