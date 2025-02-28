"use client";

import React, { useState, useEffect } from 'react';
import { ethers, parseEther, formatEther } from 'ethers';
import DelegatorSummary from './stats'; 
import Deposit from './deposit';        

export default function HomePage() {

  const contractAddress = "0x447cFe1126f5bC9700542540A7Ad3e14779230f7";
  const contractABI = [
    "function voteToUnstake() external",
    "function distributeWithdrawnFunds() external",
  ];
  

  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [poolBalance, setPoolBalance] = useState('0');
  const [error, setError] = useState('');

  // Initialize provider, signer, and contract instance
  useEffect(() => {
    const initEthers = async () => {
      if (window.ethereum) {
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          setSigner(signer);
          const contractInstance = new ethers.Contract(contractAddress, contractABI, signer);
          setContract(contractInstance);
          const balanceWei = await provider.getBalance(contractAddress);
          setPoolBalance(formatEther(balanceWei));
        } catch (err) {
          console.error(err);
          setError("Failed to connect to wallet.");
        }
      } else {
        setError("Please install MetaMask.");
      }
    };

    initEthers();
  }, []);
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="container mx-auto px-4 py-10 flex-grow">
        <div className= " bg-offblue text-offblack py-4 rounded-lg shadow-md mb-10">
          <h1 className="text-3xl font-bold text-center">Pooled Staking Dashboard</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <Deposit signer={signer} error = {error} contract = {contract} poolBalance = {poolBalance} setPoolBalance = {setPoolBalance} />
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
                <DelegatorSummary stakedEth = {poolBalance}/>
            </div>
        </div>
      </div>
      <footer className="bg-gray-200 py-4">
        <div className="container mx-auto text-center text-gray-600">
          Made for the 2025 Eigen Games. Uses the P2P Staking/Restaking API.
        </div>
      </footer>
    </div>
  );
}
