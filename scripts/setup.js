const fs = require("fs")
const path = require("path")

async function main() {
  console.log("🚀 Setting up Decentralized Organ Donation Platform...")

  // Create .env.local file if it doesn't exist
  const envPath = path.join(__dirname, "../.env.local")
  if (!fs.existsSync(envPath)) {
    const envContent = `# BNB Smart Chain Configuration
NEXT_PUBLIC_BSC_RPC_URL=https://bsc-dataseed1.binance.org/
NEXT_PUBLIC_BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/

# Contract Addresses (update after deployment)
NEXT_PUBLIC_CONTRACT_ADDRESS=your_deployed_contract_address_here

# Optional: BSCScan API Key for contract verification
BSCSCAN_API_KEY=your_bscscan_api_key_here

# Development Settings
NODE_ENV=development
`
    fs.writeFileSync(envPath, envContent)
    console.log("✅ Created .env.local file")
  } else {
    console.log("ℹ️  .env.local file already exists")
  }

  // Check if node_modules exists
  const nodeModulesPath = path.join(__dirname, "../node_modules")
  if (!fs.existsSync(nodeModulesPath)) {
    console.log("📦 Installing dependencies...")
    const { execSync } = require("child_process")
    try {
      execSync("npm install --legacy-peer-deps", { stdio: "inherit" })
      console.log("✅ Dependencies installed successfully")
    } catch (error) {
      console.error("❌ Failed to install dependencies:", error.message)
      return
    }
  } else {
    console.log("ℹ️  Dependencies already installed")
  }

  // Create types directory if it doesn't exist
  const typesDir = path.join(__dirname, "../types")
  if (!fs.existsSync(typesDir)) {
    fs.mkdirSync(typesDir, { recursive: true })
    console.log("✅ Created types directory")
  }

  // Create global.d.ts if it doesn't exist
  const globalTypesPath = path.join(typesDir, "global.d.ts")
  if (!fs.existsSync(globalTypesPath)) {
    const globalTypesContent = `declare global {
  interface Window {
    ethereum?: any
  }
}

export {}
`
    fs.writeFileSync(globalTypesPath, globalTypesContent)
    console.log("✅ Created global type definitions")
  }

  console.log("\n🎉 Setup completed successfully!")
  console.log("\n📋 Next steps:")
  console.log("1. Configure your .env.local file with your settings")
  console.log("2. Deploy smart contracts: npm run deploy")
  console.log("3. Start development server: npm run dev")
  console.log("4. Open http://localhost:3000 in your browser")
  
  console.log("\n🔗 Useful links:")
  console.log("- BSC Testnet Faucet: https://testnet.binance.org/faucet-smart")
  console.log("- BSC Explorer: https://bscscan.com/")
  console.log("- MetaMask: https://metamask.io/")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Setup failed:", error)
    process.exit(1)
  })
