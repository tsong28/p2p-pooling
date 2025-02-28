// sampleData.js

export const sampleResponse = {
    result: {
      list: [
        {
          apy: "5.6%",
          stake: "10.0",     
          currency: "ETH",
          rewards: [
            { type: "consensus", amount: "0.5", currency: "ETH" },
            { type: "execution", amount: "0.1", currency: "ETH" }
          ]
        }
      ]
    }
  };
  