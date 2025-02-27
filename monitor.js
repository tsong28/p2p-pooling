import Web3 from "web3";
import { exec } from "child_process";

const INFURA_URL = "wss://holesky.infura.io/ws/v3/YOUR_INFURA_KEY"; // WebSocket endpoint
const web3 = new Web3(new Web3.providers.WebsocketProvider(INFURA_URL));

const POOL_CONTRACT = "0xYourPoolContractAddress"; // Replace with actual contract address
const ABI = [
  {
    "anonymous": false,
    "inputs": [{ "indexed": false, "internalType": "uint256", "name": "totalBalance", "type": "uint256" }],
    "name": "ThresholdReached",
    "type": "event"
  }
];

const poolContract = new web3.eth.Contract(ABI, POOL_CONTRACT);

console.log("⏳ Listening for ThresholdReached events...");

poolContract.events.ThresholdReached()
  .on("data", (event) => {
    console.log(`✅ 32 ETH reached! Balance: ${event.returnValues.totalBalance / 1e18} ETH`);
    triggerStaking();
  })
  .on("error", (error) => {
    console.error("Event listening error:", error);
  });

function triggerStaking() {
  console.log("Executing staking script...");
  exec("node restake.js", (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing script: ${error.message}`);
      return;
    }
    console.log(`Staking Output:\n${stdout}`);
  });
}
