import '../styles/globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import type { AppProps } from 'next/app';
import Navbar from '../components/navbar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import {
  arbitrum,
  base,
  lineaTestnet,
  mainnet,
  optimism,
  polygon,
  sepolia,
  zora,
} from 'wagmi/chains';
import { getDefaultConfig, RainbowKitProvider,Chain } from '@rainbow-me/rainbowkit';

const LuksoTest: Chain = {
  id: 4201,
  name: 'Lukso',

  nativeCurrency: {
    decimals: 18,
    name: 'LYXT',
    symbol: 'LYXT',
  },
  rpcUrls: {
    public: {
      http: ['https://rpc.testnet.lukso.network'], 
    },
    default: {
      http: ['https://rpc.testnet.lukso.network'], 
    },
  },
  blockExplorers: {
    default: { name: 'Lukso Testnet', url: 'https://explorer.execution.testnet.lukso.network' },
    
  },
  testnet: true,
};

const config = getDefaultConfig({
  appName: 'RainbowKit App',
  projectId: 'bbc302f89a722c69f043215565e5bf08',
  chains: [
    mainnet,
    polygon,
    optimism,
    arbitrum,
    base,
    zora,lineaTestnet,LuksoTest,
    ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === 'true' ? [sepolia] : []),
  ],
  ssr: true,
});

const client = new QueryClient();

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={client}>
        <RainbowKitProvider>
        <Navbar/>
          <Component {...pageProps} />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default MyApp;
