import { signAndBroadcast } from "./sign.js";
import axios from "axios";
import { readFileSync } from "fs";
import { v4 as uuidv4 } from "uuid";
import { setTimeout as wait } from "timers/promises";

// Constants
const config = JSON.parse(readFileSync("./config.json", "utf-8"));
const API_BASE_URL = config.url;
const AUTH_TOKEN = config.token;
const STAKER_ADDRESS = config.stakerAddress;

// Authorization headers helper
function getAuthorizationHeaders() {
  return {
    accept: "application/json",
    authorization: AUTH_TOKEN,
    "content-type": "application/json",
  };
}

let pubkey;

async function createEigenPod() {
  const url = `${API_BASE_URL}eth/staking/eigenlayer/tx/create-pod`;
  try {
    const response = await axios.post(
      url,
      {},
      { headers: getAuthorizationHeaders() }
    );
    console.log("EigenPod Creation Response:", response.data);
    return response.data.result;
  } catch (error) {
    console.error(
      "Error creating EigenPod:",
      error.response?.data || error.message
    );
    throw error;
  }
}

async function createRestakeRequest() {
  const uuid = uuidv4();
  const url = `${API_BASE_URL}eth/staking/direct/nodes-request/create`;
  const data = {
    id: uuid,
    type: "RESTAKING",
    validatorsCount: 1,
    eigenPodOwnerAddress: STAKER_ADDRESS,
    feeRecipientAddress: STAKER_ADDRESS,
    controllerAddress: STAKER_ADDRESS,
    nodesOptions: { location: "any", relaysSet: null },
  };
  try {
    const response = await axios.post(url, data, {
      headers: getAuthorizationHeaders(),
    });
    console.log("Restake Request Response:", response.data);
    return { uuid, result: response.data.result };
  } catch (error) {
    console.error(
      "Error initiating restake request:",
      error.response?.data || error.message
    );
    throw error;
  }
}

async function getRestakeStatusWithRetry(uuid, retries = 3, delay = 3000) {
  const url = `${API_BASE_URL}eth/staking/direct/nodes-request/status/${uuid}`;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url, {
        headers: getAuthorizationHeaders(),
      });
      console.log(
        `Attempt ${attempt}: Restake Status Response:`,
        response.data
      );
      if (response.data.result.status !== "processing") {
        return response.data.result;
      }
    } catch (error) {
      console.error(
        "Error fetching restake status:",
        error.response?.data || error.message
      );
      throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  throw new Error("Restake status is still 'processing' after maximum retries");
}

async function createDepositTx(result) {
  const url = `${API_BASE_URL}eth/staking/direct/tx/deposit`;
  const depositData = result.depositData[0];
  const data = {
    depositData: [
      {
        pubkey: depositData.pubkey,
        signature: depositData.signature,
        depositDataRoot: depositData.depositDataRoot,
      },
    ],
    withdrawalAddress: result.eigenPodAddress,
  };
  try {
    const response = await axios.post(url, data, {
      headers: getAuthorizationHeaders(),
    });
    console.log("Deposit Transaction Response:", response.data);
    pubkey = depositData.pubkey;
    return response.data.result;
  } catch (error) {
    console.error(
      "Error creating deposit transaction:",
      error.response?.data || error.message
    );
    throw error;
  }
}

(async function main() {
  try {
    console.log("Starting staking process...");

    // Ensure this runs only once
    if (global.hasRun) {
      console.log("Main function already executed. Exiting...");
      return;
    }
    global.hasRun = true;

    console.log("Step 1: Creating EigenPod...");
    const podResponse = await createEigenPod();
    console.log("Pod Created:", podResponse.serializeTx);

    // ✅ Sign and Broadcast EigenPod Transaction
    console.log("Signing and broadcasting EigenPod transaction...");
    const signedPodTx = await signAndBroadcast(
      podResponse.serializeTx,
      podResponse.gasLimit,
      podResponse.maxFeePerGas,
      podResponse.maxPriorityFeePerGas,
      podResponse.value
    );

    console.log("EigenPod Transaction Broadcasted:", signedPodTx.hash);

    console.log("Step 2: Creating Restake Request...");
    const { uuid, result: restakeRequest } = await createRestakeRequest();

    console.log("Step 3: Checking Restake Status...");
    const restakeStatus = await getRestakeStatusWithRetry(uuid);

    console.log("Step 4: Creating Deposit Transaction...");
    const depositTxResponse = await createDepositTx(restakeStatus);

    console.log("Step 5: Wait 30 seconds for the first transaction to complete...");
    await wait(30000);

    console.log("Step 6: Signing & Broadcasting Deposit Transaction...");
    const signedDepositTx = await signAndBroadcast(
      depositTxResponse.serializeTx,
      depositTxResponse.gasLimit,
      depositTxResponse.maxFeePerGas,
      depositTxResponse.maxPriorityFeePerGas,
      depositTxResponse.value
    );

    console.log("Deposit Transaction Broadcasted:", signedDepositTx.hash);
    // Log the BeaconChain link for the validator
    console.log(
      `\n🔍 View your validator on BeaconChain: https://holesky.beaconcha.in/validator/${pubkey}`
    );
  } catch (error) {
    console.error("Staking process failed:", error.message);
  }
})();
