"use client";

import React, { useState } from 'react';
import { ethers, parseEther, formatEther } from 'ethers';
const contractAddress = "0x447cFe1126f5bC9700542540A7Ad3e14779230f7";
const contractABI = [
  "function voteToUnstake() external",
  "function distributeWithdrawnFunds() external",
];

const App = ({error, contract, signer, poolBalance, setPoolBalance}) => {
  const [depositAmount, setDepositAmount] = useState('');

  const [loading, setLoading] = useState(false);
  const [voteLoading, setVoteLoading] = useState(false);

  const [txId, setTxId] = useState('');
  const [voteTxId, setVoteTxId] = useState('');

  const [showVoteModal, setShowVoteModal] = useState(false);
  const [voteSuccess, setVoteSuccess] = useState(false);


  // Send ETH
  async function sendEther(amountToDeposit) {
    if (!signer) {
      console.error("Signer is not available");
      throw new Error("Signer is not available");
    }
    try {
      const tx = await signer.sendTransaction({
        to: contractAddress,
        value: amountToDeposit
      });
      console.log("Deposit transaction sent:", tx.hash);
      await tx.wait();
      console.log("Deposit transaction confirmed");
      setTxId(tx.hash);
    } catch (err) {
      console.error("Error sending deposit transaction:", err);
      throw err;
    }
  }

  const handleDeposit = async () => {
    if (!signer) return;

    setLoading(true);
    try {
      const amountBN = parseEther(depositAmount);
      await sendEther(amountBN);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const balanceWei = await provider.getBalance(contractAddress);
      setPoolBalance(formatEther(balanceWei));
      setDepositAmount('');
    } catch (err) {
      console.error(err);

    }
    setLoading(false);
  };

  // Handle vote to withdraw action
  const handleVoteWithdraw = async () => {
    if (!contract) return;
    setError('');
    setVoteLoading(true);
    try {
      const tx = await contract.voteToUnstake();
      console.log("Vote transaction sent:", tx.hash);
      await tx.wait();
      console.log("Vote transaction confirmed");
      setVoteTxId(tx.hash);
      setVoteSuccess(true);
    } catch (err) {
      console.error("Error sending vote transaction:", err);
      setError("Vote failed. Please try again.");
    }
    setVoteLoading(false);
    setShowVoteModal(false);
  };

  return (
    <>
      <div className="container">
        <h2>Deposit ETH</h2>
        <p className="balance">
          <strong>Total ETH at Address:</strong> {poolBalance} ETH
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
        {txId && (
          <p className="tx-id">
            <strong>Deposit Transaction ID:</strong> {txId}
          </p>
        )}

        <hr className="divider" />

        <h2>Vote to Withdraw ETH</h2>
        <p className="info">
          Click the button below to vote to withdraw your ETH from the pool.
        </p>
        <button
          onClick={() => setShowVoteModal(true)}
          disabled={voteLoading}
          className="vote-btn"
        >
          {voteLoading ? 'Voting...' : 'Vote to Withdraw'}
        </button>
        {voteTxId && (
          <p className="tx-id">
            <strong>Vote Transaction ID:</strong> {voteTxId}
          </p>
        )}
        {voteSuccess && (
          <p className="success-msg">
            Your vote to unstake was successful!
          </p>
        )}

        {error && <p className="error">{error}</p>}
      </div>


      {showVoteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-title">Confirm Vote to Unstake</h3>
            <p className="modal-text">
              Are you sure you want to vote to withdraw your ETH from the pool?
            </p>
            <div className="modal-buttons">
              <button
                onClick={handleVoteWithdraw}
                className="modal-confirm-btn"
                disabled={voteLoading}
              >
                Yes, Vote
              </button>
              <button
                onClick={() => setShowVoteModal(false)}
                className="modal-cancel-btn"
                disabled={voteLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .container {
          max-width: 500px;
          margin: 50px auto;
          padding: 30px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          position: relative;
        }
        h2 {
          text-align: center;
          color: #333;
          margin-bottom: 20px;
        }
        .balance,
        .info {
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
        .deposit-btn,
        .vote-btn {
          padding: 12px;
          font-size: 16px;
          background-color: #4caf50;
          color: #fff;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        .vote-btn {
          display: block;
          margin: 0 auto;
        }
        .deposit-btn:hover:not(:disabled),
        .vote-btn:hover:not(:disabled) {
          background-color: #43a047;
        }
        .deposit-btn:disabled,
        .vote-btn:disabled {
          background-color: #a5d6a7;
          cursor: not-allowed;
        }
        .tx-id {
          margin-top: 20px;
          text-align: center;
          color: #333;
          font-size: 14px;
        }
        .success-msg {
          margin-top: 20px;
          text-align: center;
          color: green;
          font-size: 16px;
          font-weight: bold;
        }
        .error {
          margin-top: 20px;
          color: #e53935;
          text-align: center;
        }
        .divider {
          margin: 40px 0;
          border-top: 1px solid #ddd;
        }
        /* Modal styling */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .modal {
          background-color: #fff;
          padding: 20px;
          border-radius: 8px;
          max-width: 400px;
          width: 100%;
          text-align: center;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }
        .modal-title {
          font-size: 20px;
          margin-bottom: 10px;
          color: #333;
        }
        .modal-text {
          font-size: 16px;
          margin-bottom: 20px;
          color: #555;
        }
        .modal-buttons {
          display: flex;
          justify-content: space-around;
        }
        .modal-confirm-btn,
        .modal-cancel-btn {
          padding: 10px 20px;
          font-size: 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        .modal-confirm-btn {
          background-color: #4caf50;
          color: #fff;
        }
        .modal-confirm-btn:hover:not(:disabled) {
          background-color: #43a047;
        }
        .modal-cancel-btn {
          background-color: #e53935;
          color: #fff;
        }
        .modal-cancel-btn:hover:not(:disabled) {
          background-color: #d32f2f;
        }
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
