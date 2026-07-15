# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*ListInvoicesByBusiness*](#listinvoicesbybusiness)
- [**Mutations**](#mutations)
  - [*CreateBusiness*](#createbusiness)
  - [*CreateClient*](#createclient)
  - [*AddLineItem*](#addlineitem)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## ListInvoicesByBusiness
You can execute the `ListInvoicesByBusiness` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listInvoicesByBusiness(vars: ListInvoicesByBusinessVariables, options?: ExecuteQueryOptions): QueryPromise<ListInvoicesByBusinessData, ListInvoicesByBusinessVariables>;

interface ListInvoicesByBusinessRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListInvoicesByBusinessVariables): QueryRef<ListInvoicesByBusinessData, ListInvoicesByBusinessVariables>;
}
export const listInvoicesByBusinessRef: ListInvoicesByBusinessRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listInvoicesByBusiness(dc: DataConnect, vars: ListInvoicesByBusinessVariables, options?: ExecuteQueryOptions): QueryPromise<ListInvoicesByBusinessData, ListInvoicesByBusinessVariables>;

interface ListInvoicesByBusinessRef {
  ...
  (dc: DataConnect, vars: ListInvoicesByBusinessVariables): QueryRef<ListInvoicesByBusinessData, ListInvoicesByBusinessVariables>;
}
export const listInvoicesByBusinessRef: ListInvoicesByBusinessRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listInvoicesByBusinessRef:
```typescript
const name = listInvoicesByBusinessRef.operationName;
console.log(name);
```

### Variables
The `ListInvoicesByBusiness` query requires an argument of type `ListInvoicesByBusinessVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListInvoicesByBusinessVariables {
  businessId: UUIDString;
}
```
### Return Type
Recall that executing the `ListInvoicesByBusiness` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListInvoicesByBusinessData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListInvoicesByBusiness`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listInvoicesByBusiness, ListInvoicesByBusinessVariables } from '@dataconnect/generated';

// The `ListInvoicesByBusiness` query requires an argument of type `ListInvoicesByBusinessVariables`:
const listInvoicesByBusinessVars: ListInvoicesByBusinessVariables = {
  businessId: ..., 
};

// Call the `listInvoicesByBusiness()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listInvoicesByBusiness(listInvoicesByBusinessVars);
// Variables can be defined inline as well.
const { data } = await listInvoicesByBusiness({ businessId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listInvoicesByBusiness(dataConnect, listInvoicesByBusinessVars);

console.log(data.invoices);

// Or, you can use the `Promise` API.
listInvoicesByBusiness(listInvoicesByBusinessVars).then((response) => {
  const data = response.data;
  console.log(data.invoices);
});
```

### Using `ListInvoicesByBusiness`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listInvoicesByBusinessRef, ListInvoicesByBusinessVariables } from '@dataconnect/generated';

// The `ListInvoicesByBusiness` query requires an argument of type `ListInvoicesByBusinessVariables`:
const listInvoicesByBusinessVars: ListInvoicesByBusinessVariables = {
  businessId: ..., 
};

// Call the `listInvoicesByBusinessRef()` function to get a reference to the query.
const ref = listInvoicesByBusinessRef(listInvoicesByBusinessVars);
// Variables can be defined inline as well.
const ref = listInvoicesByBusinessRef({ businessId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listInvoicesByBusinessRef(dataConnect, listInvoicesByBusinessVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.invoices);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.invoices);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateBusiness
You can execute the `CreateBusiness` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createBusiness(vars: CreateBusinessVariables): MutationPromise<CreateBusinessData, CreateBusinessVariables>;

interface CreateBusinessRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateBusinessVariables): MutationRef<CreateBusinessData, CreateBusinessVariables>;
}
export const createBusinessRef: CreateBusinessRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createBusiness(dc: DataConnect, vars: CreateBusinessVariables): MutationPromise<CreateBusinessData, CreateBusinessVariables>;

interface CreateBusinessRef {
  ...
  (dc: DataConnect, vars: CreateBusinessVariables): MutationRef<CreateBusinessData, CreateBusinessVariables>;
}
export const createBusinessRef: CreateBusinessRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createBusinessRef:
```typescript
const name = createBusinessRef.operationName;
console.log(name);
```

### Variables
The `CreateBusiness` mutation requires an argument of type `CreateBusinessVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateBusinessVariables {
  name: string;
  email: string;
  currency: string;
}
```
### Return Type
Recall that executing the `CreateBusiness` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateBusinessData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateBusinessData {
  business_insert: Business_Key;
}
```
### Using `CreateBusiness`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createBusiness, CreateBusinessVariables } from '@dataconnect/generated';

// The `CreateBusiness` mutation requires an argument of type `CreateBusinessVariables`:
const createBusinessVars: CreateBusinessVariables = {
  name: ..., 
  email: ..., 
  currency: ..., 
};

// Call the `createBusiness()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createBusiness(createBusinessVars);
// Variables can be defined inline as well.
const { data } = await createBusiness({ name: ..., email: ..., currency: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createBusiness(dataConnect, createBusinessVars);

console.log(data.business_insert);

// Or, you can use the `Promise` API.
createBusiness(createBusinessVars).then((response) => {
  const data = response.data;
  console.log(data.business_insert);
});
```

### Using `CreateBusiness`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createBusinessRef, CreateBusinessVariables } from '@dataconnect/generated';

// The `CreateBusiness` mutation requires an argument of type `CreateBusinessVariables`:
const createBusinessVars: CreateBusinessVariables = {
  name: ..., 
  email: ..., 
  currency: ..., 
};

// Call the `createBusinessRef()` function to get a reference to the mutation.
const ref = createBusinessRef(createBusinessVars);
// Variables can be defined inline as well.
const ref = createBusinessRef({ name: ..., email: ..., currency: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createBusinessRef(dataConnect, createBusinessVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.business_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.business_insert);
});
```

## CreateClient
You can execute the `CreateClient` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createClient(vars: CreateClientVariables): MutationPromise<CreateClientData, CreateClientVariables>;

interface CreateClientRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateClientVariables): MutationRef<CreateClientData, CreateClientVariables>;
}
export const createClientRef: CreateClientRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createClient(dc: DataConnect, vars: CreateClientVariables): MutationPromise<CreateClientData, CreateClientVariables>;

interface CreateClientRef {
  ...
  (dc: DataConnect, vars: CreateClientVariables): MutationRef<CreateClientData, CreateClientVariables>;
}
export const createClientRef: CreateClientRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createClientRef:
```typescript
const name = createClientRef.operationName;
console.log(name);
```

### Variables
The `CreateClient` mutation requires an argument of type `CreateClientVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateClientVariables {
  name: string;
  email: string;
  businessId: UUIDString;
}
```
### Return Type
Recall that executing the `CreateClient` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateClientData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateClientData {
  client_insert: Client_Key;
}
```
### Using `CreateClient`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createClient, CreateClientVariables } from '@dataconnect/generated';

// The `CreateClient` mutation requires an argument of type `CreateClientVariables`:
const createClientVars: CreateClientVariables = {
  name: ..., 
  email: ..., 
  businessId: ..., 
};

// Call the `createClient()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createClient(createClientVars);
// Variables can be defined inline as well.
const { data } = await createClient({ name: ..., email: ..., businessId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createClient(dataConnect, createClientVars);

console.log(data.client_insert);

// Or, you can use the `Promise` API.
createClient(createClientVars).then((response) => {
  const data = response.data;
  console.log(data.client_insert);
});
```

### Using `CreateClient`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createClientRef, CreateClientVariables } from '@dataconnect/generated';

// The `CreateClient` mutation requires an argument of type `CreateClientVariables`:
const createClientVars: CreateClientVariables = {
  name: ..., 
  email: ..., 
  businessId: ..., 
};

// Call the `createClientRef()` function to get a reference to the mutation.
const ref = createClientRef(createClientVars);
// Variables can be defined inline as well.
const ref = createClientRef({ name: ..., email: ..., businessId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createClientRef(dataConnect, createClientVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.client_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.client_insert);
});
```

## AddLineItem
You can execute the `AddLineItem` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
addLineItem(vars: AddLineItemVariables): MutationPromise<AddLineItemData, AddLineItemVariables>;

interface AddLineItemRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: AddLineItemVariables): MutationRef<AddLineItemData, AddLineItemVariables>;
}
export const addLineItemRef: AddLineItemRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
addLineItem(dc: DataConnect, vars: AddLineItemVariables): MutationPromise<AddLineItemData, AddLineItemVariables>;

interface AddLineItemRef {
  ...
  (dc: DataConnect, vars: AddLineItemVariables): MutationRef<AddLineItemData, AddLineItemVariables>;
}
export const addLineItemRef: AddLineItemRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the addLineItemRef:
```typescript
const name = addLineItemRef.operationName;
console.log(name);
```

### Variables
The `AddLineItem` mutation requires an argument of type `AddLineItemVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface AddLineItemVariables {
  invoiceId: UUIDString;
  description: string;
  quantity: number;
  unitPrice: number;
}
```
### Return Type
Recall that executing the `AddLineItem` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `AddLineItemData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface AddLineItemData {
  lineItem_insert: LineItem_Key;
}
```
### Using `AddLineItem`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, addLineItem, AddLineItemVariables } from '@dataconnect/generated';

// The `AddLineItem` mutation requires an argument of type `AddLineItemVariables`:
const addLineItemVars: AddLineItemVariables = {
  invoiceId: ..., 
  description: ..., 
  quantity: ..., 
  unitPrice: ..., 
};

// Call the `addLineItem()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await addLineItem(addLineItemVars);
// Variables can be defined inline as well.
const { data } = await addLineItem({ invoiceId: ..., description: ..., quantity: ..., unitPrice: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await addLineItem(dataConnect, addLineItemVars);

console.log(data.lineItem_insert);

// Or, you can use the `Promise` API.
addLineItem(addLineItemVars).then((response) => {
  const data = response.data;
  console.log(data.lineItem_insert);
});
```

### Using `AddLineItem`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, addLineItemRef, AddLineItemVariables } from '@dataconnect/generated';

// The `AddLineItem` mutation requires an argument of type `AddLineItemVariables`:
const addLineItemVars: AddLineItemVariables = {
  invoiceId: ..., 
  description: ..., 
  quantity: ..., 
  unitPrice: ..., 
};

// Call the `addLineItemRef()` function to get a reference to the mutation.
const ref = addLineItemRef(addLineItemVars);
// Variables can be defined inline as well.
const ref = addLineItemRef({ invoiceId: ..., description: ..., quantity: ..., unitPrice: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = addLineItemRef(dataConnect, addLineItemVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.lineItem_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.lineItem_insert);
});
```

