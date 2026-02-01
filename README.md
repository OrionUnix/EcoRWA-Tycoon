🏙️ EcoRWA Tycoon

**Gamifying Real World Assets on Avalanche.**
*SimCity meets Real Estate Investment.*

---

## 📖 Project Overview
**EcoRWA Tycoon**  is a decentralized crowdfunding platform that makes investing in Real World Assets (RWA) as simple and engaging as playing a city-building game. We solve the three primary barriers to real estate entry:

1.  **Complexity:** We use **AI** to analyze complex legal documents (PLU/Zoning laws) and translate them into simple game tips (Risks/Rewards).
2.  **Cost:** We use **Fractionalization (ERC-1155)** on Avalanche to allow investment starting at $50.
3.  **Boredom:** We turn passive income into a gamified "Tycoon" experience with visual progression.

## 🎯 Market Analysis & Value Proposition
### The Problem with Current RWA Platforms

Existing platforms like **RealT** have pioneered the tokenization of real estate, but they face several challenges that **EcoRWA Tycoon** aims to solve:

1.  **Passive vs. Active Management:** Most platforms offer a "set and forget" model where investors have zero say in the asset's lifecycle.
    
2.  **Transparency & Compliance:** Issues with local tax compliance and property management often arise due to a lack of community oversight.
    
3.  **High Barriers to Entry & Education:** Real estate remains intimidating. Many potential users are afraid to invest because they don't understand the underlying legal and financial mechanisms (e.g., SCI in France, REITs in the US).

### Our Solution: The "Active Tycoon" Model

EcoRWA Tycoon shifts the paradigm from passive holding to **Active Governance and Education**:

-   **Interactive Governance:** Unlike passive platforms, our users don't just hold tokens; they participate in a gamified ecosystem where they can visualize the impact of their assets on the local "Parse City" map.
    
-   **AI-Powered Due Diligence:** We bridge the gap between complex legal zoning (PLU) and investors by using AI to summarize risks. This ensures users are aware of property-specific issues (taxes, roadworks, zoning changes) before they invest.
    
-   **Educational "Learn-to-Invest" Mode:** For users who cannot or are not yet ready to invest real capital, EcoRWA Tycoon offers a simulated gaming experience. They can learn the fundamentals of real estate—understanding yields, spotting zoning traps, and managing property risks—in a risk-free environment. This creates a pipeline of educated future investors.
    
-   **Community Voting:** We empower token holders to vote on property improvements or management decisions, ensuring a decentralized and transparent oversight mechanism.
    
    ### 📊 Comparative Summary

Feature
Traditional SCI / REIT
Passive Tokenization (RealT)
EcoRWA Tycoon

**Liquidity**
Low (Months)
Medium (Days)

**High (Instant)**

**Governance**
None/Centralized
Limited

**Active/On-Chain**

**Accessibility**

High Entry Cost
$50+

**$50+ & Free Educational Mode**

**Transparency**

Annual Reports
Blockchain Explorer

**AI-Verified & Map-Based**

**Education**

None
Limited

**Gamified Learning & Risk Simulation**

## 🚀 Key Features
* **🎮 Interactive Map:** Browse "Parse City" and select buildings visually.
* **🤖 AI Urban Advisor:** An AI agent analyzes real-world Zoning Plans (PLU) to warn users about risks (e.g., "Roadworks ahead") or opportunities.
* **💸 One-Click Investing:** Purchase fractional ownership using MockUSDC on the Avalanche C-Chain.
* **📈 Live Yield System:** Watch your rental income grow in real-time (accelerated for the demo).
* **✅ Instant Compliance (Mock):** A simulated "Whitelist" system demonstrating readiness for KYC/AML Subnets.

---

## 🛠️ Tech Stack

### Blockchain & Smart Contracts
* **Network:** Avalanche C-Chain (Fuji Testnet)
* **Language:** Solidity (v0.8.20)
* **Framework:** Foundry
* **Standards:** ERC-1155 (Fractional Real Estate), ERC-20 (Payment)

### Frontend & Integration
* **Framework:** Next.js 14 (React)
* **Web3:** RainbowKit + Wagmi + Viem
* **Wallet:** Core Wallet Support
* **AI:** OpenAI API (for PLU text analysis)
* **Localization:** ``` next-intl ```
* **Animations:** Framer Motion (for premium "Tycoon" UI effects)
---

## 📦 Smart Contracts (Fuji Testnet)

| Contract | Address | Description |
| :--- | :--- | :--- |
| **EcoRWATycoon** | `0x3eb8fe6dB6F6cbD4038ddAB73E05D57C8c70C11A`  | Main logic: Minting, Yield, Whitelist |
| **MockUSDC** | `0x91d5F6B2458ea9f060EDAD50794cc79E7Ec30cE0`  | Faucet token for testing investment |

---

## ⚡ Getting Started

1.  **Install dependencies:**
    
    ```
    npm install
    
    ```
    
2.  **Launch development server:**
    
    ```
    npm run dev
    
    ```
    
3.  **Build for production (Static Export):**
    
    ```
    npm run build
    
    ```
    
    _Note: The project is configured with `output: export`. Access localized versions at `/en/` or `/fr/`._
    
    ## 🛣️ Roadmap & Future Improvements

-   [ ] **Multi-Subnet Deployment:** Expansion toward permissioned Avalanche Subnets for regulatory compliance.
    
-   [ ] **Advanced 3D City:** Integration of Three.js for immersive 3D visualization of owned assets.
    
-   [ ] **Secondary Market:** Peer-to-peer marketplace for trading asset fractions.
    
-   [ ] **AI Portfolio Manager:** Personalized investment strategies based on user risk profiles.