# 🏙️ EcoRWA Tycoon

**Gamifying Real World Assets on Avalanche.**
*SimCity meets Real Estate Investment.*

🔗 **[Play the Live Demo (Vercel)](https://eco-rwa-tycoon.vercel.app/)**
🎬 **[Watch the Video Pitch](https://youtu.be/Xss202BzPhk?si=MdPvpsbg_zuPfvp4)**

---

## 📖 Project Overview
**EcoRWA Tycoon** is a decentralized crowdfunding platform that makes investing in Real World Assets (RWA) as simple and engaging as playing a city-building game. We solve the three primary barriers to real estate entry:

1. **Complexity:** We use **AI** to analyze complex legal documents (PLU/Zoning laws) and translate them into simple game tips (Risks/Rewards).
2. **Cost:** We use **Fractionalization (ERC-1155)** on Avalanche to allow investment starting at $50.
3. **Boredom:** We turn passive income into a gamified "Tycoon" experience with visual progression and interactive governance.

---

## 🎯 Market Analysis & Value Proposition

### The Problem with Current RWA Platforms
Existing platforms like **RealT** have pioneered the tokenization of real estate, but they face several challenges:
* **Passive Management:** Most platforms offer a "set and forget" model where investors have zero say in the asset's lifecycle.
* **Transparency Issues:** Local property management issues often arise due to a lack of community oversight.
* **High Barriers to Education:** Real estate remains intimidating. Users are afraid to invest because they don't understand the underlying legal mechanisms.

### Our Solution: The "Active Tycoon" Model
EcoRWA Tycoon shifts the paradigm from passive holding to **Active Governance and Education**:
* 🏛️ **Interactive Governance (DAO):** Users don't just hold tokens; they vote on-chain for property improvements or management decisions that impact the asset.
* 🤖 **AI-Powered Due Diligence:** We bridge the gap between complex legal zoning (PLU) and investors by using AI to summarize risks before they invest.
* 🎮 **Educational "Learn-to-Invest" Mode:** Users can learn the fundamentals of real estate—understanding yields and spotting zoning traps—in a risk-free, gamified environment using Mock Tokens.

### 📊 Comparative Summary

| Feature | Traditional SCI / REIT | Passive Tokenization (RealT) | 🌟 EcoRWA Tycoon |
| :--- | :--- | :--- | :--- |
| **Liquidity** | Low (Months) | Medium (Days) | **High (Instant / Gamified OTC)** |
| **Governance** | None/Centralized | Limited | **Active On-Chain DAO** |
| **Accessibility**| High Entry Cost | $50+ | **$50+ & Free Educational Mode** |
| **Transparency** | Annual Reports | Blockchain Explorer | **AI-Verified & Visual Map** |
| **Education** | None | Limited | **Gamified Risk Simulation** |

---

## 🛠️ MVP MoSCoW Analysis (March 9 Target)

To ensure a focused and functional prototype for the Hackathon evaluation, we applied the MoSCoW framework:

* 🔴 **Must Have (Core Infrastructure):**
  * Avalanche Smart Contracts (ERC-1155 fractional shares & Yield Vault).
  * Web3 Wallet Connection (RainbowKit) & true transaction signing.
  * Interactive Dashboard showing live accumulating yield and on-chain ledger.
  * Live deployment accessible to judges (Vercel).
* 🟠 **Should Have (UX & Gamification):**
  * 2D Isometric City Map rendering (PixiJS) for visual asset location.
  * Active DAO Governance system with individualized crisis scenarios (Yes/No impact).
* 🟡 **Could Have (Polish & Scalability):**
  * Local state/Cloud persistence for cross-session gameplay.
  * Dynamic OTC Secondary Market reacting to DAO votes.
  * Real-time LLM API integration for the "Jordan" AI Advisor.
* ⚪ **Won't Have (Out of Scope for MVP):**
  * Mainnet deployment with real user funds.
  * Fully compliant KYC/AML integration.
  * Multiplayer MMO features.

---

## 🚀 Key Features
* **🎮 Interactive Map:** Browse "Parse City" and select buildings visually in a 2D isometric space.
* **🤖 AI Urban Advisor:** An AI agent analyzes real-world Zoning Plans (PLU) to warn users about risks (e.g., "Roadworks ahead") or opportunities.
* **💸 One-Click Investing:** Purchase fractional ownership using MockUSDC on the Avalanche C-Chain.
* **📈 Live Yield System:** Watch your rental income grow in real-time (accelerated for the demo).
* **✅ Instant Compliance (Mock):** A simulated "Whitelist" system demonstrating readiness for KYC/AML Subnets.

---

## 💻 Tech Stack

### Blockchain & Smart Contracts
* **Network:** Avalanche C-Chain (Fuji Testnet)
* **Language:** Solidity (v0.8.20)
* **Framework:** Foundry
* **Standards:** ERC-1155 (Fractional Real Estate), ERC-20 (Payment)

### Frontend & Game Engine
* **Framework:** Next.js 14 (React)
* **Game Engine:** PixiJS (WebGL 2D Isometric Rendering)
* **Web3 Integration:** RainbowKit + Wagmi + Viem
* **Localization:** `next-intl` (English / French)
* **UI/UX:** TailwindCSS + Framer Motion

---

## 📦 Smart Contracts (Fuji Testnet)

| Contract | Address | Description |
| :--- | :--- | :--- |
| **EcoRWATycoon Vault** | `0x3eb8fe6dB6F6cbD4038ddAB73E05D57C8c70C11A` | Main logic: Minting, Yield, Whitelist |
| **MockUSDC** | `0x91d5F6B2458ea9f060EDAD50794cc79E7Ec30cE0` | Faucet token for testing investment |

---

## ⚡ Getting Started (Local Development)

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/OrionUnix/EcoRWA-Tycoon.git](https://github.com/OrionUnix/EcoRWA-Tycoon.git)
   cd EcoRWA-Tycoon/frontend