import React from "react";
import ReactDOM from "react-dom/client";
import "@socialproof/dapp-kit/dist/index.css";
import "@radix-ui/themes/styles.css";

import { MysClientProvider, WalletProvider } from "@socialproof/dapp-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Theme } from "@radix-ui/themes";
import App from "./App.tsx";
import { networkConfig } from "./networkConfig.ts";

const queryClient = new QueryClient();

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
