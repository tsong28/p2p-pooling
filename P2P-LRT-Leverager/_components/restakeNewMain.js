(async function main() {
    try {
      console.log("Starting leveraged restaking process...");
  
      if (global.hasRun) {
        console.log("Main function already executed. Exiting...");
        return;
      }
      global.hasRun = true;
  
      console.log("Step 1: Checking Validator Status...");
      await checkValidatorStatus(VALIDATOR_PUB_KEY);
  
      console.log("Step 2: Activating Restake Request...");
      await createActivateRestakeRequest(VALIDATOR_PUB_KEY);
  
      console.log("Step 3: Delegating to Operator...");
      const delegateResponse = await createDelegateOperatorTx(OPERATOR_ADDRESS);
      console.log("Delegation Transaction:", delegateResponse);
  
      console.log("Signing & Broadcasting Delegation Transaction...");
      await signAndBroadcast(
        delegateResponse.serializeTx,
        delegateResponse.gasLimit,
        delegateResponse.maxFeePerGas,
        delegateResponse.maxPriorityFeePerGas,
        delegateResponse.value
      );
  
      console.log("Step 4: Borrowing ETH Against LRTs...");
      const borrowedETH = await borrowETHAgainstLRTs("0xLRTTokenAddress", 5);
      
      console.log(`Borrowed ${borrowedETH} ETH, now restaking...`);
      
      console.log("Step 5: Restaking Borrowed ETH...");
      await createActivateRestakeRequest(borrowedETH);
  
      console.log("Step 6: Repeating Process Until Max Leverage...");
      
    } catch (error) {
      console.error("Leveraged restaking process failed:", error.message);
    }
  })();
  