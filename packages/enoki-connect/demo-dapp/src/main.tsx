// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0
import React from "react";
import ReactDOM from "react-dom/client";
import "@mysocial/dapp-kit/dist/index.css";
import "@radix-ui/themes/styles.css";

import { MysClientProvider, WalletProvider } from "@mysocial/dapp-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Theme } from "@radix-ui/themes";
import App from "./App.tsx";
import { networkConfig } from "./networkConfig.ts";
import { registerEnokiConnectWallets } from "@mysocial/enoki-connect";

const queryClient = new QueryClient();

registerEnokiConnectWallets({
  publicAppSlugs: ["dev-app", "dev-app-not-exists"],
  enokiApiUrl: "http://localhost:3084",
  network: "testnet",
  dappName: "Test Dapp",
}).catch(() => {});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Theme appearance="dark">
      <QueryClientProvider client={queryClient}>
        <MysClientProvider networks={networkConfig} defaultNetwork="testnet">
          <WalletProvider autoConnect>
            <App />
          </WalletProvider>
        </MysClientProvider>
      </QueryClientProvider>
    </Theme>
  </React.StrictMode>,
);
