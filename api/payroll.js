import { handleFinanceRequest } from '../lib/finance-core.js';

export default async function handler(req, res) {
  req.query = { ...(req.query || {}), resource: 'finance', financeResource: 'staff-hours' };
  return handleFinanceRequest(req, res);
}
