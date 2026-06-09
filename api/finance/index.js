import { handleFinanceRequest } from '../../lib/finance-core.js';

export default async function handler(req, res) {
  return handleFinanceRequest(req, res);
}
