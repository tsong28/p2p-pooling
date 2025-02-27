"use client";

import React, { useEffect, useState } from 'react';
import { sampleResponse } from './sampleData'; // Adjust the path as needed

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
      // Uncomment below to use live data.
      // const queryParams = new URLSearchParams(params).toString();
      // const response = await fetch(`${url}?${queryParams}`, { headers });
      // if (!response.ok) {
      //   throw new Error(`HTTP error! status: ${response.status}`);
      // }
      // const data = await response.json();

      // For testing purposes, simulate API delay and use sample data.
      await new Promise((resolve) => setTimeout(resolve, 1000)); // simulate delay
      const data = sampleResponse;

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
    <div className="max-w-lg mx-auto my-12 p-6 bg-white rounded-lg shadow-lg font-sans">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
        Delegator Summary
      </h2>
      {loading && <p className="text-center text-gray-600">Loading...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}
      {delegatorData && (
        <div className="space-y-4">
          <p className="text-lg">
            <span className="font-semibold">APY:</span> {delegatorData.apy}
          </p>
          <p className="text-lg">
            <span className="font-semibold">Your Staked ETH:</span> {delegatorData.stake} {delegatorData.currency}
          </p>
          <p className="text-lg">
            <span className="font-semibold">Total Rewards in Pool:</span> {delegatorData.rewards.reduce((acc, reward) => acc + parseFloat(reward.amount), 0)} {delegatorData.rewards[0]?.currency}
          </p>
          <p className="text-lg">
            <span className="font-semibold">Reward per ETH Staked:</span> {rewardRate !== null ? rewardRate.toFixed(4) : '0.0000'}
          </p>
          <div className="mt-6 border-t pt-4">
            <h3 className="text-xl font-bold text-gray-700 mb-2">Individual Rewards</h3>
            {delegatorData.rewards.map((reward, index) => (
              <div key={index} className="p-4 border rounded-md mb-2">
                <p className="text-md">
                  <span className="font-semibold">Type:</span> {reward.type}
                </p>
                <p className="text-md">
                  <span className="font-semibold">Amount:</span> {reward.amount} {reward.currency}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={fetchDelegatorSummary}
        disabled={loading}
        className="mt-6 w-full py-3 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition-colors disabled:bg-blue-300"
      >
        {loading ? "Refreshing..." : "Refresh Data"}
      </button>
    </div>
  );
};

export default DelegatorSummary;
