# Mys dApp Starter Template

This dApp was created using `@socialproof/create-dapp` that sets up a basic React
Client dApp using the following tools:

- [React](https://react.dev/) as the UI framework
- [TypeScript](https://www.typescriptlang.org/) for type checking
- [Vite](https://vitejs.dev/) for build tooling
- [Radix UI](https://www.radix-ui.com/) for pre-built UI components
- [ESLint](https://eslint.org/) for linting
- [`@socialproof/dapp-kit`](https://sdk.mysocial.network/dapp-kit) for connecting to
  wallets and loading data
- [pnpm](https://pnpm.io/) for package management

For a full guide on how to build this dApp from scratch, visit this
[guide](http://docs.mysocial.network/guides/developer/app-examples/e2e-counter#frontend).

## Deploying your Move code

### Install Mys cli

Before deploying your move code, ensure that you have installed the Mys CLI. You
can follow the [Mys installation instruction](https://docs.mysocial.network/build/install)
to get everything set up.

This template uses `testnet` by default, so we'll need to set up a testnet
environment in the CLI:

```bash
mys client new-env --alias testnet --rpc https://fullnode.testnet.mysocial.network443
mys client switch --env testnet
```

If you haven't set up an address in the mys client yet, you can use the
following command to get a new address:

```bash
mys client new-address secp256k1
```

This well generate a new address and recover phrase for you. You can mark a
newly created address as you active address by running the following command
with your new address:

```bash
mys client switch --address 0xYOUR_ADDRESS...
```

We can ensure we have some Mys in our new wallet by requesting Mys from the
faucet `https://faucet.mysocial.network`.

### Publishing the move package

The move code for this template is located in the `move` directory. To publish
it, you can enter the `move` directory, and publish it with the Mys CLI:

```bash
cd move
mys client publish --gas-budget 100000000 counter
```

In the output there will be an object with a `"packageId"` property. You'll want
to save that package ID to the `src/constants.ts` file as `PACKAGE_ID`:

```ts
export const TESTNET_COUNTER_PACKAGE_ID = "<YOUR_PACKAGE_ID>";
```

Now that we have published the move code, and update the package ID, we can
start the app.

## Starting your dApp

To install dependencies you can run

```bash
pnpm install
```

To start your dApp in development mode run

```bash
pnpm dev
```

## Building

To build your app for deployment you can run

```bash
pnpm build
```
