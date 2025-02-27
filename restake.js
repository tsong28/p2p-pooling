import { signAndBroadcast } from "./sign.js";
import axios from "axios";
import { readFileSync } from "fs";

// Constants
const config = JSON.parse(readFileSync("./config.json", "utf-8"));
const API_BASE_URL = config.url;
const AUTH_TOKEN = config.token;
const STAKER_ADDRESS = config.stakerAddress;
const VALIDATOR_PUB_KEY =
  "0xb5bf506b95d08e635eee959945254e236ab8896b892bf7de37c588eea17596287aa302d63c2ec84b67c900e74a5eaa6e";
  //"0x800934f77ed347994543783357b7ac27c98dd12d71c19c170830b3290fedd750266637854f8d3547bc23fa03fa9d2485"; example key
const OPERATOR_ADDRESS = "0xa4e245c3a1cb2f0512a71b9cd908dca2f1641781";
  //"0x37d5077434723d0ec21d894a52567cbe6fb2c3d8"; example operator

// Authorization headers helper
function getAuthorizationHeaders() {
  return {
    accept: "application/json",
    authorization: AUTH_TOKEN,
    "content-type": "application/json",
  };
}

async function checkValidatorStatus(pubKey) {
  const url = `${API_BASE_URL}eth/staking/direct/validator/status`;
  const data = { pubkeys: [pubKey] };

  try {
    const response = await axios.post(url, data, {
      headers: getAuthorizationHeaders(),
    });
    const validatorStatus = response.data.result.list[0]?.status;
    console.log(`Validator Status: ${validatorStatus}`);

    if (validatorStatus !== "active_ongoing") {
      throw new Error("Validator is not yet active.");
    }
  } catch (error) {
    console.error(
      "Error checking validator status:",
      error.response?.data || error.message
    );
    throw error;
  }
}

async function createActivateRestakeRequest(pubKey) {
  const url = `${API_BASE_URL}eth/staking/eigenlayer/tx/verify-withdrawal-credentials`;
  const data = {
    eigenPodOwnerAddress: STAKER_ADDRESS,
    pubKey: pubKey,
  };

  // console.log("\n🔍 Raw API Request:");
  // console.log(`URL: ${url}`);
  // //console.log("Headers:", JSON.stringify(headers, null, 2));
  // console.log("Body:", JSON.stringify(data, null, 2));

  try {
    const response = await axios.post(url, data, {
      headers: getAuthorizationHeaders(),
    });
    console.log("Restake Request Response:", response.data);
    return response.data.result;
  } catch (error) {
    console.error("\n🚨 Error initiating restake request:", error);

    // Log the raw failed request
    console.error("\n❌ Raw Request That Failed:");
    console.error("URL:", url);
    console.error("Headers:", JSON.stringify(headers, null, 2));
    console.error("Body:", JSON.stringify(data, null, 2));

    if (error.response) {
        console.error("\n❌ Error Response Data:", JSON.stringify(error.response.data, null, 2));
        console.error("\n❌ Status Code:", error.response.status);
        console.error("\n❌ Headers:", JSON.stringify(error.response.headers, null, 2));
    } else {
        console.error("\n❌ No Response Received - Network Error:", error.message);
    }

    throw error;
}
}

async function createDelegateOperatorTx(operatorAddress) {
  const url = `${API_BASE_URL}eth/staking/eigenlayer/tx/delegate-to`;
  const data = {
    operatorAddress: operatorAddress,
  };
  try {
    const response = await axios.post(url, data, {
      headers: getAuthorizationHeaders(),
    });
    console.log("Delegate Request Response:", response.data);
    return response.data.result;
  } catch (error) {
    console.error(
      "Error initiating delegate request:",
      error.response?.data || error.message
    );
    throw error;
  }
}

(async function main() {
  try {
    console.log("Starting restaking process...");

    if (global.hasRun) {
      console.log("Main function already executed. Exiting...");
      return;
    }
    global.hasRun = true;

    console.log("Step 1: Checking if Validator is Active...");
    await checkValidatorStatus(VALIDATOR_PUB_KEY);
    console.log("Validator is active. Proceeding with restaking process...");

    console.log("Step 2: Activating Restake Request...");
    const restakeActivation = await createActivateRestakeRequest(
      VALIDATOR_PUB_KEY
    );
    console.log("Restake Activated:", restakeActivation);

    console.log("Step 3: Delegating to Operator...");
    const delegateResponse = await createDelegateOperatorTx(OPERATOR_ADDRESS);
    console.log("Delegation Transaction Response:", delegateResponse);

    console.log("Signing and Broadcasting Delegation Transaction...");
    const signedDelegateTx = await signAndBroadcast(
      delegateResponse.serializeTx,
      delegateResponse.gasLimit,
      delegateResponse.maxFeePerGas,
      delegateResponse.maxPriorityFeePerGas,
      delegateResponse.value
    );
    console.log("Delegation Transaction Broadcasted:", signedDelegateTx.hash);
  } catch (error) {
    console.error("Restaking process failed:", error.message);
  }
})();
