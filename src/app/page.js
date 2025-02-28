"use client";

import DelegatorSummary from './stats';  // Adjust the path if needed
import Deposit from './deposit';         // deposit.js exports the deposit component as default

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="container mx-auto px-4 py-10 flex-grow">
        <div className= " bg-offblue text-offblack py-4 rounded-lg shadow-md mb-10">
          <h1 className="text-3xl font-bold text-center">Pooled Staking Dashboard</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <Deposit />
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
                <DelegatorSummary />
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
