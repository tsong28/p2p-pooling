import Web3 from "web3";
import axios from "axios";
import { exec } from "child_process";

// Web3 Configuration
const INFURA_URL = "wss://holesky.infura.io/ws/v3/YOUR_INFURA_KEY"; // Replace with actual Infura key
const web3 = new Web3(new Web3.providers.WebsocketProvider(INFURA_URL));

// Contract Configuration
const POOL_CONTRACT = "0xYourPoolContractAddress"; // Replace with actual contract address
const STAKER_ADDRESS = "0xYourStakerAddress"; // Replace with your ETHPool contract's address
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
  }
];

const poolContract = new web3.eth.Contract(ABI, POOL_CONTRACT);
console.log("🔍 Monitoring ETHPool events...");

// **Monitor `ThresholdReached` Event (Triggers Staking)**
poolContract.events.ThresholdReached()
  .on("data", (event) => {
    console.log(`✅ 32 ETH reached! Staking initiated... Balance: ${event.returnValues.totalBalance / 1e18} ETH`);
    triggerStaking();
  })
  .on("error", (error) => {
    console.error("⚠️ Event Listening Error:", error);
  });

// **Monitor `Unstaked` Event (Triggers Withdrawal)**
poolContract.events.Unstaked()
  .on("data", async (event) => {
    const unstakeAmount = event.returnValues.amount;
    console.log(`🔄 Unstaking Event Detected! Requesting Withdrawal of ${unstakeAmount / 1e18} ETH...`);
    
    try {
      await initiateWithdrawal(unstakeAmount);
      console.log("✅ Withdrawal Process Initiated Successfully!");
    } catch (error) {
      console.error("❌ Withdrawal Process Failed:", error.message);
    }
  })
  .on("error", (error) => {
    console.error("⚠️ Unstake Event Error:", error);
  });

// **Execute Staking Script (`restake.js`)**
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

// **Initiate Withdrawal Process**
async function initiateWithdrawal(amount) {
  console.log(`🔄 Initiating withdrawal process for ${amount / 1e18} ETH...`);

  try {
    // **Step 1: Start Checkpoint**
    const checkpointData = await startCheckpoint();
    const checkpointId = checkpointData.result.checkpointId;
    
    // **Step 2: Verify Checkpoint Proofs**
    await verifyCheckpointProofs(checkpointId);

    // **Step 3: Queue Withdrawal Request**
    await queueWithdrawals(amount);

    // **Step 4: Complete Queued Withdrawals**
    await completeQueuedWithdrawals();

    console.log("✅ Withdrawal Process Completed Successfully!");
  } catch (error) {
    console.error("❌ Error during withdrawal process:", error.message);
    throw error;
  }
}

// **Start Checkpoint**
async function startCheckpoint() {
  const url = `${API_BASE_URL}eth/staking/eigenlayer/tx/start-checkpoint`;
  const data = {
    eigenPodOwnerAddress: STAKER_ADDRESS
  };

  try {
    const response = await axios.post(url, data, {
      headers: getAuthorizationHeaders()
    });
    console.log("✅ Checkpoint Started:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Failed to Start Checkpoint:", error.response?.data || error.message);
    throw error;
  }
}

// **Verify Checkpoint Proofs**
async function verifyCheckpointProofs(checkpointId) {
  const url = `${API_BASE_URL}eth/staking/eigenlayer/tx/verify-checkpoint-proofs`;
  const data = {
    checkpointId: checkpointId,
    eigenPodOwnerAddress: STAKER_ADDRESS
  };

  try {
    const response = await axios.post(url, data, {
      headers: getAuthorizationHeaders()
    });
    console.log("✅ Checkpoint Proofs Verified:", response.data);
  } catch (error) {
    console.error("❌ Failed to Verify Checkpoint Proofs:", error.response?.data || error.message);
    throw error;
  }
}

// **Queue Withdrawals**
async function queueWithdrawals(amount) {
  const url = `${API_BASE_URL}eth/staking/eigenlayer/tx/queue-withdrawals`;
  const data = {
    eigenPodOwnerAddress: STAKER_ADDRESS,
    amount: amount.toString()
  };

  try {
    const response = await axios.post(url, data, {
      headers: getAuthorizationHeaders()
    });
    console.log("✅ Withdrawals Queued:", response.data);
  } catch (error) {
    console.error("❌ Failed to Queue Withdrawals:", error.response?.data || error.message);
    throw error;
  }
}

// **Complete Queued Withdrawals**
async function completeQueuedWithdrawals() {
  const url = `${API_BASE_URL}eth/staking/eigenlayer/tx/complete-queued-withdrawals`;
  const data = {
    eigenPodOwnerAddress: STAKER_ADDRESS
  };

  try {
    const response = await axios.post(url, data, {
      headers: getAuthorizationHeaders()
    });
    console.log("✅ Withdrawals Completed:", response.data);
  } catch (error) {
    console.error("❌ Failed to Complete Withdrawals:", error.response?.data || error.message);
    throw error;
  }
}

// **Helper Function for API Headers**
function getAuthorizationHeaders() {
  return {
    accept: "application/json",
    authorization: "Bearer YOUR_P2P_API_KEY", // Replace with actual API Key
    "content-type": "application/json",
  };
}
