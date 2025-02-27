async function borrowETHAgainstLRTs(lrtTokenAddress, amountToDeposit) {
    console.log("Depositing LRTs as collateral...");
  
    const url = `${config.lendingPlatform}/deposit`;
    const data = {
      asset: lrtTokenAddress,
      amount: amountToDeposit,
      onBehalfOf: STAKER_ADDRESS
    };
  
    try {
      const response = await axios.post(url, data, {
        headers: getAuthorizationHeaders(),
      });
      console.log("Collateral deposited. Borrowing ETH...");
  
      const borrowData = {
        asset: "ETH",
        amount: amountToDeposit * config.maxLeverageFactor,
        interestRateMode: 2
      };
  
      const borrowResponse = await axios.post(`${config.lendingPlatform}/borrow`, borrowData, {
        headers: getAuthorizationHeaders(),
      });
  
      console.log("Borrowed ETH:", borrowResponse.data);
      return borrowResponse.data.amount;
    } catch (error) {
      console.error("Error in leveraged borrowing:", error.response?.data || error.message);
      throw error;
    }
  }
  