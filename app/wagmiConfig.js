import { bsc } from '@wagmi/core/chains';
import { injected } from '@wagmi/connectors';
import { http, createConfig } from '@wagmi/core';
import { getDefaultConfig } from '@rainbow-me/rainbowkit'

export const config = getDefaultConfig({
  appName: 'NovaBank',
  projectId: 'YOUR_PROJECT_ID',
  chains: [bsc],
  transports: {
    [bsc.id]: http("/api/rpc"),
  },
})