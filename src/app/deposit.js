"use client";

import React, { useState, useEffect } from 'react';
import { ethers, parseEther, formatEther } from 'ethers';

// Replace with your contract's ABI
const contractABI = [
  "function deposit() public payable",
  "function totalDeposits() public view returns (uint256)"
];

// Replace with your deployed contract's address
const contractAddress = "0xYourContractAddress";

const App = () => {
  const [depositAmount, setDepositAmount] = useState('');
  const [poolBalance, setPoolBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [contract, setContract] = useState(null);

  // Initialize the provider, signer, and contract instance
  useEffect(() => {
    const initEthers = async () => {
      if (window.ethereum) {
        try {
          // Request wallet connection
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          // For ethers v6, use BrowserProvider
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contractInstance = new ethers.Contract(contractAddress, contractABI, signer);
          setContract(contractInstance);
          fetchPoolBalance(contractInstance);
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

  // Function to fetch the current pool balance from the contract
  const fetchPoolBalance = async (contractInstance) => {
    try {
      const balanceWei = await contractInstance.balance;
      // Use formatEther directly from ethers v6
      setPoolBalance(formatEther(balanceWei));
    } catch (err) {
      console.error(err);
      setError("Failed to fetch pool balance.");
    }
  };

  // Handle the deposit action
  const handleDeposit = async () => {
    if (!contract) return;
    setError('');
    setLoading(true);
    try {
      // Use parseEther directly from ethers v6
      const tx = await contract.deposit({
        value: parseEther(depositAmount)
      });
      // Wait for transaction confirmation
      await tx.wait();
      // Refresh the pool balance after deposit
      fetchPoolBalance(contract);
      setDepositAmount('');
    } catch (err) {
      console.error(err);
      setError("Deposit failed. Please try again.");
    }
    setLoading(false);
  };

  return (
    <>
      <div className="container">
        <h2>Deposit ETH into Pool</h2>
        <p className="balance">
          <strong>Total ETH in Pool:</strong> {poolBalance} ETH
        </p>
        <div className="form">
          <input
            type="text"
            placeholder="Amount in ETH"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            className="input-field"
          />
          <button
            onClick={handleDeposit}
            disabled={loading || !depositAmount}
            className="deposit-btn"
          >
            {loading ? 'Depositing...' : 'Deposit'}
          </button>
        </div>
        {error && <p className="error">{error}</p>}
      </div>

      <style jsx>{`
        .container {
          max-width: 400px;
          margin: 50px auto;
          padding: 30px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        h2 {
          text-align: center;
          color: #333;
          margin-bottom: 20px;
        }
        .balance {
          text-align: center;
          font-size: 18px;
          margin-bottom: 20px;
        }
        .form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .input-field {
          padding: 12px;
          font-size: 16px;
          border: 1px solid #ccc;
          border-radius: 4px;
          transition: border-color 0.3s ease;
        }
        .input-field:focus {
          outline: none;
          border-color: #4caf50;
        }
        .deposit-btn {
          padding: 12px;
          font-size: 16px;
          background-color: #4caf50;
          color: #fff;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        .deposit-btn:hover:not(:disabled) {
          background-color: #43a047;
        }
        .deposit-btn:disabled {
          background-color: #a5d6a7;
          cursor: not-allowed;
        }
        .error {
          margin-top: 20px;
          color: #e53935;
          text-align: center;
        }
        /* Global body styling if needed */
        :global(body) {
          background-color: #f5f5f5;
          margin: 0;
          padding: 0;
        }
      `}</style>
    </>
  );
};

export default App;
