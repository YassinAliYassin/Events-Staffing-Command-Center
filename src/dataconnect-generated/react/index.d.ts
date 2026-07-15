import { CreateBusinessData, CreateBusinessVariables, CreateClientData, CreateClientVariables, ListInvoicesByBusinessData, ListInvoicesByBusinessVariables, AddLineItemData, AddLineItemVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateBusiness(options?: useDataConnectMutationOptions<CreateBusinessData, FirebaseError, CreateBusinessVariables>): UseDataConnectMutationResult<CreateBusinessData, CreateBusinessVariables>;
export function useCreateBusiness(dc: DataConnect, options?: useDataConnectMutationOptions<CreateBusinessData, FirebaseError, CreateBusinessVariables>): UseDataConnectMutationResult<CreateBusinessData, CreateBusinessVariables>;

export function useCreateClient(options?: useDataConnectMutationOptions<CreateClientData, FirebaseError, CreateClientVariables>): UseDataConnectMutationResult<CreateClientData, CreateClientVariables>;
export function useCreateClient(dc: DataConnect, options?: useDataConnectMutationOptions<CreateClientData, FirebaseError, CreateClientVariables>): UseDataConnectMutationResult<CreateClientData, CreateClientVariables>;

export function useListInvoicesByBusiness(vars: ListInvoicesByBusinessVariables, options?: useDataConnectQueryOptions<ListInvoicesByBusinessData>): UseDataConnectQueryResult<ListInvoicesByBusinessData, ListInvoicesByBusinessVariables>;
export function useListInvoicesByBusiness(dc: DataConnect, vars: ListInvoicesByBusinessVariables, options?: useDataConnectQueryOptions<ListInvoicesByBusinessData>): UseDataConnectQueryResult<ListInvoicesByBusinessData, ListInvoicesByBusinessVariables>;

export function useAddLineItem(options?: useDataConnectMutationOptions<AddLineItemData, FirebaseError, AddLineItemVariables>): UseDataConnectMutationResult<AddLineItemData, AddLineItemVariables>;
export function useAddLineItem(dc: DataConnect, options?: useDataConnectMutationOptions<AddLineItemData, FirebaseError, AddLineItemVariables>): UseDataConnectMutationResult<AddLineItemData, AddLineItemVariables>;
