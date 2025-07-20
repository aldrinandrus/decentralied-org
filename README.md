# Decentralized Organ Donation Platform

A blockchain-powered platform for secure organ donor-recipient matching using BNB Smart Chain.

## Features

- 🔐 **Secure Blockchain Storage**: Immutable medical records on BNB Smart Chain
- 🤖 **Smart Matching**: AI-powered donor-recipient compatibility matching
- 👥 **Multi-Stakeholder Support**: Hospitals, donors, and recipients with role-based access
- ⚡ **Real-Time Updates**: Instant notifications via blockchain events
- 🎨 **Modern UI**: Beautiful, responsive interface built with Next.js and Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components
- **Blockchain**: Ethers.js, BNB Smart Chain
- **Development**: Hardhat, Solidity

## Prerequisites

- Node.js 18+ 
- npm or pnpm
- MetaMask browser extension
- BNB Smart Chain configured in MetaMask

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd decentralized-organ-platform-backend
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_BSC_RPC_URL=https://bsc-dataseed1.binance.org/
   NEXT_PUBLIC_BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
   NEXT_PUBLIC_CONTRACT_ADDRESS=your_deployed_contract_address
   ```

## Development

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

3. **Connect MetaMask**
   - Install MetaMask if you haven't already
   - Add BNB Smart Chain to MetaMask:
     - Network Name: BNB Smart Chain
     - RPC URL: https://bsc-dataseed1.binance.org/
     - Chain ID: 56
     - Currency Symbol: BNB

## Smart Contract Deployment

1. **Install Hardhat dependencies**
   ```bash
   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
   ```

2. **Configure Hardhat**
   Update `hardhat.config.js` with your network settings and private keys.

3. **Deploy contracts**
   ```bash
   npx hardhat run scripts/deploy.js --network bsc
   ```

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard page
│   ├── matching/          # Matching page
│   ├── register/          # Registration page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── providers/         # Context providers
│   ├── ui/               # UI components
│   └── transaction/      # Transaction components
├── contracts/            # Smart contracts
├── lib/                  # Utility functions
├── hooks/                # Custom React hooks
└── types/                # TypeScript type definitions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Deployment

### Vercel (Recommended)

1. **Connect to Vercel**
   - Push your code to GitHub
   - Connect your repository to Vercel
   - Add environment variables in Vercel dashboard

2. **Deploy**
   ```bash
   vercel --prod
   ```

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the GitHub repository or contact the development team.

---

**Note**: This is a demonstration platform. For production use in healthcare, ensure compliance with all relevant regulations and security standards.
