import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise, DataConnectSettings } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;
export const dataConnectSettings: DataConnectSettings;

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

interface CreateBusinessRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateBusinessVariables): MutationRef<CreateBusinessData, CreateBusinessVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateBusinessVariables): MutationRef<CreateBusinessData, CreateBusinessVariables>;
  operationName: string;
}
export const createBusinessRef: CreateBusinessRef;

export function createBusiness(vars: CreateBusinessVariables): MutationPromise<CreateBusinessData, CreateBusinessVariables>;
export function createBusiness(dc: DataConnect, vars: CreateBusinessVariables): MutationPromise<CreateBusinessData, CreateBusinessVariables>;

interface CreateClientRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateClientVariables): MutationRef<CreateClientData, CreateClientVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateClientVariables): MutationRef<CreateClientData, CreateClientVariables>;
  operationName: string;
}
export const createClientRef: CreateClientRef;

export function createClient(vars: CreateClientVariables): MutationPromise<CreateClientData, CreateClientVariables>;
export function createClient(dc: DataConnect, vars: CreateClientVariables): MutationPromise<CreateClientData, CreateClientVariables>;

interface ListInvoicesByBusinessRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListInvoicesByBusinessVariables): QueryRef<ListInvoicesByBusinessData, ListInvoicesByBusinessVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListInvoicesByBusinessVariables): QueryRef<ListInvoicesByBusinessData, ListInvoicesByBusinessVariables>;
  operationName: string;
}
export const listInvoicesByBusinessRef: ListInvoicesByBusinessRef;

export function listInvoicesByBusiness(vars: ListInvoicesByBusinessVariables, options?: ExecuteQueryOptions): QueryPromise<ListInvoicesByBusinessData, ListInvoicesByBusinessVariables>;
export function listInvoicesByBusiness(dc: DataConnect, vars: ListInvoicesByBusinessVariables, options?: ExecuteQueryOptions): QueryPromise<ListInvoicesByBusinessData, ListInvoicesByBusinessVariables>;

interface AddLineItemRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: AddLineItemVariables): MutationRef<AddLineItemData, AddLineItemVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: AddLineItemVariables): MutationRef<AddLineItemData, AddLineItemVariables>;
  operationName: string;
}
export const addLineItemRef: AddLineItemRef;

export function addLineItem(vars: AddLineItemVariables): MutationPromise<AddLineItemData, AddLineItemVariables>;
export function addLineItem(dc: DataConnect, vars: AddLineItemVariables): MutationPromise<AddLineItemData, AddLineItemVariables>;

