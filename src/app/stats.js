"use client";

import React, { useEffect, useState } from 'react';

const DelegatorSummary = () => {
  const [delegatorData, setDelegatorData] = useState(null);
  const [rewardRate, setRewardRate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Parameters for the API request.
  const params = {
    address: "0x338EF19fA2eC0fc4d1277B1307a613fA1FBbc0cb", // Delegator address.
    addressType: "deposit", // Address type (e.g., deposit or withdrawal)
    network: "ethereum",  // Network name.
    startAt: "2024-04-17T15:00:00.000Z",  // Start time in ISO 8601.
    finishAt: "2024-04-19T15:00:00.000Z",  // Finish time in ISO 8601.
    groupBy: "all",  // Aggregate data for the entire period.
    skip: "validator"  // Exclude breakdown by validator.
  };

  // Add any required headers (update as needed)
  const headers = {
    "Content-Type": "application/json"
    // "Authorization": "Bearer YOUR_API_TOKEN" // Uncomment and update if needed.
  };

  // Base URL for the API; update with your actual endpoint.
  const baseUrl = 'https://api.example.com'; 
  // Format the URL (assuming the API endpoint uses the network as a path parameter)
  const url = `${baseUrl}/${params.network}/delegator-summary`;

  const fetchDelegatorSummary = async () => {
    setLoading(true);
    setError('');
    try {
      // Convert params object into a query string.
      const queryParams = new URLSearchParams(params).toString();
      const response = await fetch(`${url}?${queryParams}`, { headers });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data && data.result && data.result.list && data.result.list.length > 0) {
        const summary = data.result.list[0];
        setDelegatorData(summary);
        // Calculate total rewards by summing the reward amounts.
        const totalRewards = summary.rewards.reduce((acc, reward) => {
          return acc + parseFloat(reward.amount);
        }, 0);
        // Compute reward per staked ETH.
        const stake = parseFloat(summary.stake);
        const computedRate = stake > 0 ? totalRewards / stake : 0;
        setRewardRate(computedRate);
      } else {
        setError("Empty response received.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch delegator summary.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDelegatorSummary();
  }, []);

  return (
    <>
      <div className="container">
        <h2>Delegator Summary</h2>
        {loading && <p>Loading...</p>}
        {error && <p className="error">{error}</p>}
        {delegatorData && (
          <div className="summary">
            <p><strong>APY:</strong> {delegatorData.apy}</p>
            <p>
              <strong>Stake:</strong> {delegatorData.stake} {delegatorData.currency}
            </p>
            <p>
              <strong>Total Rewards:</strong> {
                delegatorData.rewards.reduce((acc, reward) => acc + parseFloat(reward.amount), 0)
              } {delegatorData.rewards[0]?.currency}
            </p>
            <p>
              <strong>Reward per ETH Staked:</strong> {rewardRate !== null ? rewardRate.toFixed(4) : '0.0000'}
            </p>
            <div className="rewards-list">
              <h3>Individual Rewards</h3>
              {delegatorData.rewards.map((reward, index) => (
                <div key={index} className="reward-item">
                  <p><strong>Type:</strong> {reward.type}</p>
                  <p>
                    <strong>Amount:</strong> {reward.amount} {reward.currency}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        <button onClick={fetchDelegatorSummary} disabled={loading} className="refresh-btn">
          {loading ? "Refreshing..." : "Refresh Data"}
        </button>
      </div>

      <style jsx>{`
        .container {
          max-width: 500px;
          margin: 50px auto;
          padding: 20px;
          background-color: #fff;
          border-radius: 10px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          font-family: Arial, sans-serif;
        }
        h2 {
          text-align: center;
          color: #333;
          margin-bottom: 20px;
        }
        .summary p {
          font-size: 16px;
          margin: 10px 0;
        }
        .rewards-list {
          margin-top: 20px;
          border-top: 1px solid #eee;
          padding-top: 15px;
        }
        .reward-item {
          padding: 10px;
          border-bottom: 1px solid #eee;
        }
        .reward-item:last-child {
          border-bottom: none;
        }
        .refresh-btn {
          display: block;
          width: 100%;
          padding: 12px;
          margin-top: 20px;
          background-color: #0070f3;
          color: #fff;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        .refresh-btn:hover:not(:disabled) {
          background-color: #005bb5;
        }
        .refresh-btn:disabled {
          background-color: #a0c4ff;
          cursor: not-allowed;
        }
        .error {
          color: red;
          text-align: center;
        }
      `}</style>
    </>
  );
};

export default DelegatorSummary;
