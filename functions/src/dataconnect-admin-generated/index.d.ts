import { ConnectorConfig, DataConnect, OperationOptions, ExecuteOperationResponse } from 'firebase-admin/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;


export interface AddLineItemData {
  lineItem_insert: LineItem_Key;
}

export interface AddLineItemVariables {
  invoiceId: UUIDString;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Business_Key {
  id: UUIDString;
  __typename?: 'Business_Key';
}

export interface Client_Key {
  id: UUIDString;
  __typename?: 'Client_Key';
}

export interface CreateBusinessData {
  business_insert: Business_Key;
}

export interface CreateBusinessVariables {
  name: string;
  email: string;
  currency: string;
}

export interface CreateClientData {
  client_insert: Client_Key;
}

export interface CreateClientVariables {
  name: string;
  email: string;
  businessId: UUIDString;
}

export interface Invoice_Key {
  id: UUIDString;
  __typename?: 'Invoice_Key';
}

export interface LineItem_Key {
  id: UUIDString;
  __typename?: 'LineItem_Key';
}

export interface ListInvoicesByBusinessData {
  invoices: ({
    id: UUIDString;
    status: string;
    totalAmount: number;
    client: {
      name: string;
    };
  } & Invoice_Key)[];
}

export interface ListInvoicesByBusinessVariables {
  businessId: UUIDString;
}

export interface Payment_Key {
  id: UUIDString;
  __typename?: 'Payment_Key';
}

/** Generated Node Admin SDK operation action function for the 'CreateBusiness' Mutation. Allow users to execute without passing in DataConnect. */
export function createBusiness(dc: DataConnect, vars: CreateBusinessVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateBusinessData>>;
/** Generated Node Admin SDK operation action function for the 'CreateBusiness' Mutation. Allow users to pass in custom DataConnect instances. */
export function createBusiness(vars: CreateBusinessVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateBusinessData>>;

/** Generated Node Admin SDK operation action function for the 'CreateClient' Mutation. Allow users to execute without passing in DataConnect. */
export function createClient(dc: DataConnect, vars: CreateClientVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateClientData>>;
/** Generated Node Admin SDK operation action function for the 'CreateClient' Mutation. Allow users to pass in custom DataConnect instances. */
export function createClient(vars: CreateClientVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateClientData>>;

/** Generated Node Admin SDK operation action function for the 'ListInvoicesByBusiness' Query. Allow users to execute without passing in DataConnect. */
export function listInvoicesByBusiness(dc: DataConnect, vars: ListInvoicesByBusinessVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListInvoicesByBusinessData>>;
/** Generated Node Admin SDK operation action function for the 'ListInvoicesByBusiness' Query. Allow users to pass in custom DataConnect instances. */
export function listInvoicesByBusiness(vars: ListInvoicesByBusinessVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListInvoicesByBusinessData>>;

/** Generated Node Admin SDK operation action function for the 'AddLineItem' Mutation. Allow users to execute without passing in DataConnect. */
export function addLineItem(dc: DataConnect, vars: AddLineItemVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<AddLineItemData>>;
/** Generated Node Admin SDK operation action function for the 'AddLineItem' Mutation. Allow users to pass in custom DataConnect instances. */
export function addLineItem(vars: AddLineItemVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<AddLineItemData>>;

