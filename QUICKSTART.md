# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Prerequisites
- Node.js 18+ installed
- MetaMask browser extension
- BNB Smart Chain configured in MetaMask

### 2. Setup Project
```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd decentralized-organ-platform-backend

# Run automated setup
npm run setup
```

### 3. Configure MetaMask
1. Open MetaMask
2. Add BNB Smart Chain network:
   - Network Name: `BNB Smart Chain`
   - RPC URL: `https://bsc-dataseed1.binance.org/`
   - Chain ID: `56`
   - Currency Symbol: `BNB`
3. Get testnet BNB from: https://testnet.binance.org/faucet-smart

### 4. Start Development Server
```bash
npm run dev
```

### 5. Open Application
Navigate to: http://localhost:3000

### 6. Connect Wallet
1. Click "Connect Wallet" button
2. Approve connection in MetaMask
3. Switch to BNB Smart Chain if prompted

## 🎯 What You Can Do

### For Donors:
1. **Register**: Complete KYC and organ donation registration
2. **Dashboard**: View your registration status and potential matches
3. **Matching**: Find compatible recipients

### For Recipients:
1. **Search**: Find available donors
2. **Match**: Connect with compatible donors
3. **Track**: Monitor match status

### For Medical Professionals:
1. **Verify**: Approve donor registrations
2. **Monitor**: Track all matches and transactions
3. **Audit**: View complete blockchain history

## 🔧 Troubleshooting

### Common Issues:

**"Cannot find module" errors**
```bash
npm install --legacy-peer-deps
```

**"Wrong Network" error**
- Switch to BNB Smart Chain in MetaMask
- Chain ID should be 56 (mainnet) or 97 (testnet)

**"Insufficient BNB" error**
- Get testnet BNB from faucet
- Ensure wallet has enough balance

**"Contract not deployed" error**
```bash
npm run deploy
```

## 📞 Support
- Check the main README.md for detailed documentation
- Open an issue on GitHub for bugs
- Join our community for discussions

---
**Ready to save lives with blockchain technology! 🫀** 