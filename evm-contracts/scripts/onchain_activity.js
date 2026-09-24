const { ethers } = require("hardhat");

async function main() {
    console.log("Preparing On-Chain Activity (Requirement 6)...");

    const contractAddress = "0x8894374598d0FFcE8E42eC6387745126F8186E9a"; // The deployed testnet contract
    const BotChainPayAsYouRead = await ethers.getContractAt("BotChainPayAsYouRead", contractAddress);

    // Get the deployer wallet (Wallet 1)
    const [deployer] = await ethers.getSigners();
    console.log(`Using Deployer Wallet (Wallet 1): ${deployer.address}`);

    // Generate Wallet 2 and Wallet 3
    const wallet2 = ethers.Wallet.createRandom().connect(ethers.provider);
    const wallet3 = ethers.Wallet.createRandom().connect(ethers.provider);

    console.log(`Generated Wallet 2: ${wallet2.address}`);
    console.log(`Generated Wallet 3: ${wallet3.address}`);

    console.log("\n⚠️ IMPORTANT: You must send some Testnet BOT to Wallet 2 and Wallet 3 before this script can continue!");
    console.log(`Please send test BOT to: ${wallet2.address} and ${wallet3.address}`);
    console.log("Waiting 30 seconds for you to fund them...");
    
    // Wait for 30 seconds to allow the user to use the faucet for the two new wallets
    await new Promise(resolve => setTimeout(resolve, 30000));

    try {
        console.log("\nStarting 5+ real on-chain interactions...");

        // Interaction 1: Wallet 1 (Deployer) registers a book
        console.log("Interaction 1: Wallet 1 registering a book...");
        let tx1 = await BotChainPayAsYouRead.connect(deployer).registerBook("The Testnet Guide", 100, 10, ethers.parseEther("0.01"), ethers.parseEther("0.1"));
        await tx1.wait();
        console.log("✅ Book 1 registered!");

        // Interaction 2: Wallet 1 registers a second book
        console.log("Interaction 2: Wallet 1 registering another book...");
        let tx2 = await BotChainPayAsYouRead.connect(deployer).registerBook("BOT Chain Secrets", 50, 5, ethers.parseEther("0.02"), ethers.parseEther("0.15"));
        await tx2.wait();
        console.log("✅ Book 2 registered!");

        // Interaction 3: Wallet 2 unlocks a page in Book 1
        console.log("Interaction 3: Wallet 2 unlocking page in Book 1...");
        let tx3 = await BotChainPayAsYouRead.connect(wallet2).selfUnlockPage(1, 1, { value: ethers.parseEther("0.01") });
        await tx3.wait();
        console.log("✅ Wallet 2 unlocked page 1!");

        // Interaction 4: Wallet 3 unlocks a chapter in Book 1
        console.log("Interaction 4: Wallet 3 unlocking chapter in Book 1...");
        let tx4 = await BotChainPayAsYouRead.connect(wallet3).selfUnlockChapter(1, 1, { value: ethers.parseEther("0.1") });
        await tx4.wait();
        console.log("✅ Wallet 3 unlocked chapter 1!");

        // Interaction 5: Wallet 2 unlocks a page in Book 2
        console.log("Interaction 5: Wallet 2 unlocking page in Book 2...");
        let tx5 = await BotChainPayAsYouRead.connect(wallet2).selfUnlockPage(2, 1, { value: ethers.parseEther("0.02") });
        await tx5.wait();
        console.log("✅ Wallet 2 unlocked page 1 of Book 2!");

        // Interaction 6: Wallet 3 unlocks a page in Book 2
        console.log("Interaction 6: Wallet 3 unlocking page in Book 2...");
        let tx6 = await BotChainPayAsYouRead.connect(wallet3).selfUnlockPage(2, 5, { value: ethers.parseEther("0.02") });
        await tx6.wait();
        console.log("✅ Wallet 3 unlocked page 5 of Book 2!");

        console.log("\n🎉 Successfully completed 6 on-chain interactions across 3 independent wallets!");
    } catch (error) {
        console.error("\n❌ Error during on-chain interactions. Ensure Wallet 2 and 3 have BOT gas and the contract is deployed.");
        console.error(error);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
