// sampleData.js

export const sampleResponse = {
    result: {
      list: [
        {
          apy: "5.6%",
          stake: "10.0",       // Stake in ETH (as a string)
          currency: "ETH",
          rewards: [
            { type: "staking", amount: "0.5", currency: "ETH" },
            { type: "bonus", amount: "0.1", currency: "ETH" }
          ]
        }
      ]
    }
  };
  