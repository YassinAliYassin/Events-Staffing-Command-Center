import { queryRef, executeQuery, validateArgsWithOptions, mutationRef, executeMutation, validateArgs, makeMemoryCacheProvider } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'yassin',
  location: 'europe-west1'
};
export const dataConnectSettings = {
  cacheSettings: {
    cacheProvider: makeMemoryCacheProvider()
  }
};
export const createBusinessRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateBusiness', inputVars);
}
createBusinessRef.operationName = 'CreateBusiness';

export function createBusiness(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createBusinessRef(dcInstance, inputVars));
}

export const createClientRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateClient', inputVars);
}
createClientRef.operationName = 'CreateClient';

export function createClient(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createClientRef(dcInstance, inputVars));
}

export const listInvoicesByBusinessRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListInvoicesByBusiness', inputVars);
}
listInvoicesByBusinessRef.operationName = 'ListInvoicesByBusiness';

export function listInvoicesByBusiness(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listInvoicesByBusinessRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}

export const addLineItemRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'AddLineItem', inputVars);
}
addLineItemRef.operationName = 'AddLineItem';

export function addLineItem(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(addLineItemRef(dcInstance, inputVars));
}

