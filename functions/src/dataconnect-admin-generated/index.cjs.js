const { validateAdminArgs } = require('firebase-admin/data-connect');

const connectorConfig = {
  connector: 'example',
  serviceId: 'yassin',
  location: 'europe-west1'
};
exports.connectorConfig = connectorConfig;

function createBusiness(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('CreateBusiness', inputVars, inputOpts);
}
exports.createBusiness = createBusiness;

function createClient(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('CreateClient', inputVars, inputOpts);
}
exports.createClient = createClient;

function listInvoicesByBusiness(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ListInvoicesByBusiness', inputVars, inputOpts);
}
exports.listInvoicesByBusiness = listInvoicesByBusiness;

function addLineItem(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('AddLineItem', inputVars, inputOpts);
}
exports.addLineItem = addLineItem;

