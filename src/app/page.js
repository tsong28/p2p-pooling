"use client";

import DelegatorSummary from './stats';  // Adjust the path if needed
import Deposit from './deposit';         // deposit.js exports the deposit component as default

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-10">Pooled Staking Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <Deposit />
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
                <DelegatorSummary />
            </div>

        </div>
      </div>
    </div>
  );
}
