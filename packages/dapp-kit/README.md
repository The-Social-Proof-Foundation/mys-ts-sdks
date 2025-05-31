# Mys dApp Kit

The Mys dApp Kit is a set of React components, hooks, and utilities that make it easy to build a
dApp for the Mys ecosystem. It provides hooks and components for querying data from the Mys
blockchain, and connecting to Mys wallets.

See https://sdk.mysocial.network/typescript for full documentation

### Core Features

- **Query Hooks:** dApp Kit provides a set of hooks for making rpc calls to the Mys blockchain,
  making it easy to load any information needed for your dApp.
- **Automatic Wallet State Management:** dApp Kit removes the complexity of state management related
  to wallet connections. You can focus on building your dApp.
- **Supports all Mys wallets:** No need to manually define wallets you support. All Mys wallets are
  automatically supported.
- **Easy to integrate:** dApp Kit provides pre-built React Components that you can drop right into
  your dApp, for easier integration
- **Flexible:** dApp Kit ships both fully functional React Component, and lower level hooks that you
  can use to build your own custom components.

## Install from NPM

To use the Mys dApp Kit in your project, run the following command in your project root:

```sh npm2yarn
npm i --save @mysten/dapp-kit @socialproof/mys @tanstack/react-query
```

## Setting up providers

To be able to use the hooks and components in the dApp Kit, you need to wrap your app with a couple
providers. The props available on the providers are covered in more detail in their respective docs
pages.

```tsx
import { createNetworkConfig, MysClientProvider, WalletProvider } from '@socialproof/dapp-kit';
import { getFullnodeUrl, type MysClientOptions } from '@socialproof/mys/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Config options for the networks you want to connect to
const { networkConfig } = createNetworkConfig({
	localnet: { url: getFullnodeUrl('localnet') },
	mainnet: { url: getFullnodeUrl('mainnet') },
});
const queryClient = new QueryClient();

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<MysClientProvider networks={networkConfig} defaultNetwork="localnet">
				<WalletProvider>
					<YourApp />
				</WalletProvider>
			</MysClientProvider>
		</QueryClientProvider>
	);
}
```

## Using UI components to connect to a wallet

The dApp Kit provides a set of flexible UI components that can be used to connect and manage wallet
accounts from your dApp. The components are built on top of
[Radix UI](https://www.radix-ui.com/primitives) and are customizable so you can quickly get your
dApp up and running.

To use our provided UI components, you will need to import the dApp Kit's CSS stylesheet into your
dApp as shown below. For more information regarding customization options, check out the respective
documentation pages for the components and [themes](https://sdk.mysocial.network/dapp-kit/themes).

```tsx
import '@socialproof/dapp-kit/dist/index.css';
```

## Using hooks to make RPC calls

The dApp Kit provides a set of hooks for making RPC calls to the Mys blockchain. The hooks are thin
wrappers around `useQuery` from `@tanstack/react-query`. For more comprehensive documentation on how
these query hooks can be used, check out the
[react-query docs](https://tanstack.com/query/latest/docs/react/overview).

```tsx
import { useMysClientQuery } from '@socialproof/dapp-kit';

function MyComponent() {
	const { data, isPending, error, refetch } = useMysClientQuery('getOwnedObjects', {
		owner: '0x123',
	});

	if (isPending) {
		return <div>Loading...</div>;
	}

	return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
```
