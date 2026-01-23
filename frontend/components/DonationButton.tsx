'use client';

import { useState } from 'react';

interface WalletAddress {
  name: string;
  address: string;
  icon: string;
}

const WALLET_ADDRESSES: WalletAddress[] = [
  {
    name: 'Bitcoin (BTC)',
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    icon: '₿',
  },
  {
    name: 'Ethereum (ETH)',
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
    icon: 'Ξ',
  },
  {
    name: 'Solana (SOL)',
    address: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
    icon: '◎',
  },
];

export default function DonationButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const copyToClipboard = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white px-6 py-2.5 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
        aria-label="Support with crypto donations"
      >
        <span className="text-xl">💰</span>
        <span>Support Us</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Support Wikithat
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Help keep Wikithat running! Donate via crypto:
            </p>

            <div className="space-y-3">
              {WALLET_ADDRESSES.map((wallet) => (
                <div
                  key={wallet.name}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="text-2xl">{wallet.icon}</span>
                      {wallet.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1.5 rounded text-gray-700 dark:text-gray-300 break-all font-mono">
                      {wallet.address}
                    </code>
                    <button
                      onClick={() => copyToClipboard(wallet.address)}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                        copiedAddress === wallet.address
                          ? 'bg-green-500 text-white'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                      aria-label={`Copy ${wallet.name} address`}
                    >
                      {copiedAddress === wallet.address ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
              Thank you for your support! 🙏
            </p>
          </div>
        </>
      )}
    </div>
  );
}
