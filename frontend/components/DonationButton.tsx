'use client';

import { useState } from 'react';
import Image from 'next/image';

interface WalletAddress {
  name: string;
  address: string;
  icon: string;
}

const WALLET_ADDRESSES: WalletAddress[] = [
  {
    name: 'Bitcoin (BTC)',
    address: 'bc1qd3x0kwmte4gqum9a80cqccr7jm2dp0gtr6n28y',
    icon: '₿',
  },
  {
    name: 'Ethereum (ETH)',
    address: '0x089bE998D8387cc87cdBC8f5154F07587547Ee73',
    icon: 'Ξ',
  },
  {
    name: 'Solana (SOL)',
    address: 'DtjpMxhEJY4eFCnY5tLPnQEfqUzDank8wWnWE377EMg',
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
        className="group bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-600 hover:from-orange-600 hover:via-yellow-600 hover:to-orange-700 text-white px-5 py-2.5 rounded-full font-semibold shadow-lg hover:shadow-2xl transition-all duration-300 flex items-center gap-2.5 border border-orange-400/30 hover:scale-105"
        aria-label="Support with crypto donations"
      >
        <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-lg group-hover:rotate-12 transition-transform duration-300">
          ₿
        </div>
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
          <div className="absolute right-0 mt-2 w-[500px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 p-6">
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

            <div className="space-y-4">
              {WALLET_ADDRESSES.map((wallet) => (
                <div
                  key={wallet.name}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md ${
                      wallet.name.includes('Bitcoin') ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                      wallet.name.includes('Ethereum') ? 'bg-gradient-to-br from-blue-500 to-purple-600' :
                      'bg-gradient-to-br from-purple-500 via-cyan-500 to-green-400'
                    }`}>
                      {wallet.icon}
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {wallet.name}
                    </span>
                  </div>

                  <div className="flex gap-4">
                    {/* QR Code */}
                    <div className="flex-shrink-0">
                      <Image
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(wallet.address)}`}
                        alt={`${wallet.name} QR Code`}
                        width={120}
                        height={120}
                        className="rounded border border-gray-300 dark:border-gray-600"
                        unoptimized
                      />
                    </div>

                    {/* Address and Copy Button */}
                    <div className="flex-1 flex flex-col justify-center gap-2">
                      <code className="text-xs bg-gray-100 dark:bg-gray-900 px-3 py-2 rounded text-gray-700 dark:text-gray-300 break-all font-mono">
                        {wallet.address}
                      </code>
                      <button
                        onClick={() => copyToClipboard(wallet.address)}
                        className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                          copiedAddress === wallet.address
                            ? 'bg-green-500 text-white'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                        aria-label={`Copy ${wallet.name} address`}
                      >
                        {copiedAddress === wallet.address ? '✓ Copied' : 'Copy Address'}
                      </button>
                    </div>
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
