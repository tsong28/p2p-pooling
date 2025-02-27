import Web3 from "web3";
import axios from "axios";
import { exec } from "child_process";

// Web3 Configuration
const INFURA_URL = "wss://holesky.infura.io/ws/v3/YOUR_INFURA_KEY"; // WebSocket endpoint
const web3 = new Web3(new Web3.providers.WebsocketProvider(INFURA_URL));

// Contract Configuration
const POOL_CONTRACT = "0xYourPoolContractAddress"; // Replace with actual contract address
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
  }
];

const poolContract = new web3.eth.Contract(ABI, POOL_CONTRACT);
console.log("🔍 Monitoring ETHPool events...");

// 🚀 Step 1: Monitor `ThresholdReached` Event (Triggers Staking)
poolContract.events.ThresholdReached()
  .on("data", (event) => {
    console.log(`✅ 32 ETH reached! Staking initiated... Balance: ${event.returnValues.totalBalance / 1e18} ETH`);
    triggerStaking();
  })
  .on("error", (error) => {
    console.error("⚠️ Event Listening Error:", error);
  });

// 🚀 Step 2: Monitor `Unstaked` Event (Triggers Withdrawal)
poolContract.events.Unstaked()
  .on("data", async (event) => {
    const unstakeAmount = event.returnValues.amount;
    console.log(`🔄 Unstaking Event Detected! Requesting Withdrawal of ${unstakeAmount / 1e18} ETH...`);
    
    try {
      await withdrawRestakedETH(unstakeAmount);
      console.log("✅ Withdrawal Successful! Initiating Distribution...");
      await distributeFunds();
    } catch (error) {
      console.error("❌ Withdrawal or Distribution Failed:", error.message);
    }
  })
  .on("error", (error) => {
    console.error("⚠️ Unstake Event Error:", error);
  });

// 📌 Execute Staking Script (`restake.js`)
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

// 📌 Withdraw Restaked ETH from EigenLayer via P2P API
async function withdrawRestakedETH(amount) {
  console.log(`🔄 Requesting withdrawal of ${amount / 1e18} ETH from EigenLayer...`);

  const url = `${API_BASE_URL}eth/staking/eigenlayer/withdraw`;
  const data = {
    amount: amount.toString(),
    withdrawalAddress: POOL_CONTRACT
  };

  try {
    const response = await axios.post(url, data, {
      headers: getAuthorizationHeaders()
    });
    console.log("✅ Withdrawal Successful:", response.data);
    return response.data.result;
  } catch (error) {
    console.error("❌ Withdrawal Failed:", error.response?.data || error.message);
    throw error;
  }
}

// 📌 Distribute Withdrawn ETH to Depositors
async function distributeFunds() {
  console.log("🚀 Distributing funds to depositors...");

  const contract = new web3.eth.Contract(ABI, POOL_CONTRACT);
  const sender = "0xYourEOA"; // Replace with your Ethereum wallet

  try {
    const gasEstimate = await contract.methods.distributeWithdrawnFunds().estimateGas({ from: sender });
    
    const tx = await contract.methods.distributeWithdrawnFunds().send({
      from: sender,
      gas: gasEstimate
    });

    console.log("✅ ETH Distribution Successful:", tx.transactionHash);
  } catch (error) {
    console.error("❌ Distribution Failed:", error.message);
  }
}

// 📌 Helper Function for API Headers
function getAuthorizationHeaders() {
  return {
    accept: "application/json",
    authorization: "Bearer YOUR_P2P_API_KEY",
    "content-type": "application/json",
  };
}
