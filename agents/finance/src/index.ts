/**
 * Finance Agent
 * Company: ESCC | Section: payroll
 */
import { BaseEsccAgent, type AgentResult, type EsccAgentContext, type TimesheetRecord, type Staff } from "@escc/core";
import { manifest } from "./manifest.js";

export type * from "@escc/core";
export { manifest } from "./manifest.js";

const ZAR = new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" });

interface PayrollLine {
  staffId: number;
  name: string;
  hours: number;
  rate: number;
  pay: number;
  payZar: string;
}

export class FinanceAgent extends BaseEsccAgent {
  readonly manifest = manifest;
  protected route(intent: string, payload?: unknown): AgentResult | Promise<AgentResult> {
    if (!this.ctx) return this.unknownIntent(intent);
    switch (intent) {
      case "payroll.summary":
        return this.payrollSummary();
      case "payroll.export":
        return this.payrollSummary();
      case "payment.remind":
        return this.paymentRemind(payload);
      default:
        return this.unknownIntent(intent);
    }
  }

  private payrollSummary(): AgentResult {
    const ctx = this.ctx as EsccAgentContext;
    const byStaff: PayrollLine[] = ctx.staff.map((s: Staff) => {
      const shifts = ctx.records.filter(
        (r: TimesheetRecord) => r.staffId === s.id && typeof r.clockOut === "number"
      );
      const ms = shifts.reduce((a, r) => a + ((r.clockOut as number) - r.clockIn), 0);
      const hours = ms / 3_600_000;
      const pay = hours * s.rate;
      return { staffId: s.id, name: s.name, hours, rate: s.rate, pay, payZar: ZAR.format(pay) };
    });
    const totalPay = byStaff.reduce((a, r) => a + r.pay, 0);
    return { ok: true, totalPay, totalPayZar: ZAR.format(totalPay), byStaff };
  }

  private paymentRemind(payload?: unknown): AgentResult {
    const ctx = this.ctx as EsccAgentContext;
    const p = (payload ?? {}) as { staffId?: number };
    const staff = ctx.staff.find((s) => s.id === p.staffId);
    if (!staff) {
      return { ok: false, agent: this.manifest.id, error: "staffId not found in roster" };
    }
    const shifts = ctx.records.filter(
      (r) => r.staffId === staff.id && typeof r.clockOut === "number"
    );
    const ms = shifts.reduce((a, r) => a + ((r.clockOut as number) - r.clockIn), 0);
    const amount = (ms / 3_600_000) * staff.rate;
    const message =
      `Hi ${staff.name}, your pending payroll is ${ZAR.format(amount)} ` +
      `for ${shifts.length} shift(s). Reply to confirm your banking details. — ESCC Finance`;
    // Per contract, the actual send is delegated to the dispatch agent.
    return { ok: true, intent: "payment.remind", staffId: staff.id, amount, message, delegate: "dispatch" };
  }
}

export function createAgent(): FinanceAgent {
  return new FinanceAgent();
}

export default createAgent;
