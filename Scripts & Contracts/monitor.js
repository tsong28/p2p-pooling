import Web3 from "web3";
import axios from "axios";
import cron from "node-cron"; // For scheduled reward distribution
import { exec } from "child_process";

// ✅ Web3 Configuration
const INFURA_URL = "wss://holesky.infura.io/ws/v3/YOUR_INFURA_KEY"; 
const web3 = new Web3(new Web3.providers.WebsocketProvider(INFURA_URL));

// ✅ Contract Configuration
const POOL_CONTRACT = "0xYourPoolContractAddress"; 
const ADMIN_ADDRESS = "0xYourWalletAddress"; // Must be the contract owner
const API_BASE_URL = "https://api-test-holesky.p2p.org/api/v1/";

const ABI = [
  {
    "anonymous": false,
    "inputs": [{ "indexed": false, "internalType": "uint256", "name": "totalBalance", "type": "uint256" }],
    "name": "ThresholdReached",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [{ "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }],
    "name": "Unstaked",
    "type": "event"
  },
  { "inputs": [], "name": "claimAndDistributeRewards", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [], "name": "distributeWithdrawnFunds", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
];

const poolContract = new web3.eth.Contract(ABI, POOL_CONTRACT);
console.log("🔍 Monitoring ETHPool events...");

// ✅ **Monitor `ThresholdReached` Event (Triggers Staking)**
poolContract.events.ThresholdReached()
  .on("data", (event) => {
    console.log(`✅ 32 ETH reached! Staking initiated... Balance: ${event.returnValues.totalBalance / 1e18} ETH`);
    triggerStaking();
  })
  .on("error", (error) => {
    console.error("⚠️ Event Listening Error:", error);
  });

// ✅ **Monitor `Unstaked` Event (Triggers Withdrawal)**
poolContract.events.Unstaked()
  .on("data", async (event) => {
    const unstakeAmount = event.returnValues.amount;
    console.log(`🔄 Unstaking Event Detected! Requesting Withdrawal of ${unstakeAmount / 1e18} ETH...`);
    
    try {
      await initiateWithdrawal(unstakeAmount);
      console.log("✅ Withdrawal Process Initiated Successfully!");

      // 🔄 Wait for ETH withdrawal before distributing funds
      setTimeout(async () => {
        console.log("💰 Checking if ETH is available for distribution...");
        
        const contractBalance = await web3.eth.getBalance(POOL_CONTRACT);
        if (contractBalance >= unstakeAmount) {
          console.log("💸 ETH Withdrawn! Distributing funds to depositors...");
          await callDistributeFunds();
        } else {
          console.log("❌ ETH has not yet arrived in the contract. Retrying...");
        }
      }, 60000); // Check again in 1 minute

    } catch (error) {
      console.error("❌ Withdrawal Process Failed:", error.message);
    }
  })
  .on("error", (error) => {
    console.error("⚠️ Unstake Event Error:", error);
  });

// ✅ **Scheduled Reward Distribution (Every 8 Days)**
cron.schedule("0 0 */8 * *", async () => {
    console.log("⏳ Checking if it's time for reward distribution...");
    
    try {
        console.log("🚀 8 days passed! Distributing rewards...");
        await distributeRewards();
    } catch (error) {
        console.error("❌ Error distributing rewards:", error.message);
    }
});

// ✅ **Execute `claimAndDistributeRewards()` Every 8 Days**
async function distributeRewards() {
    try {
        const tx = await poolContract.methods.claimAndDistributeRewards().send({
            from: ADMIN_ADDRESS,
            gas: 300000
        });
        console.log("✅ Rewards Distributed Successfully! TX Hash:", tx.transactionHash);
    } catch (error) {
        console.error("❌ Error Distributing Rewards:", error.message);
    }
}

// ✅ **Execute Staking Script (`restake.js`)**
function triggerStaking() {
  console.log("⏳ Executing staking script...");
  exec("node restake.js", (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Staking Script Execution Failed: ${error.message}`);
      return;
    }
    console.log(`📜 Staking Output:\n${stdout}`);
  });
}

// ✅ **Initiate Withdrawal Process**
async function initiateWithdrawal(amount) {
  console.log(`🔄 Initiating withdrawal process for ${amount / 1e18} ETH...`);

  try {
    const checkpointData = await startCheckpoint();
    const checkpointId = checkpointData.result.checkpointId;
    
    await verifyCheckpointProofs(checkpointId);
    await queueWithdrawals(amount);
    await completeQueuedWithdrawals();

    console.log("✅ Withdrawal Process Completed Successfully!");
  } catch (error) {
    console.error("❌ Error during withdrawal process:", error.message);
    throw error;
  }
}

// ✅ **Call `distributeWithdrawnFunds()` When ETH is Available**
async function callDistributeFunds() {
  try {
    const tx = await poolContract.methods.distributeWithdrawnFunds().send({
      from: ADMIN_ADDRESS,
      gas: 300000
    });
    console.log("✅ Funds Distributed Successfully! TX Hash:", tx.transactionHash);
  } catch (error) {
    console.error("❌ Error Distributing Funds:", error.message);
  }
}

// ✅ **Start Checkpoint for EigenLayer Withdrawal**
async function startCheckpoint() {
  const url = `${API_BASE_URL}eth/staking/eigenlayer/tx/start-checkpoint`;
  const data = { eigenPodOwnerAddress: STAKER_ADDRESS };

  try {
    const response = await axios.post(url, data, { headers: getAuthorizationHeaders() });
    console.log("✅ Checkpoint Started:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Failed to Start Checkpoint:", error.response?.data || error.message);
    throw error;
  }
}

// ✅ **API Headers Helper**
function getAuthorizationHeaders() {
  return {
    accept: "application/json",
    authorization: "Bearer YOUR_P2P_API_KEY",
    "content-type": "application/json",
  };
}
