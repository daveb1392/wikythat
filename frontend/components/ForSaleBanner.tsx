import Link from 'next/link';

export default function ForSaleBanner() {
  return (
    <div className="bg-gradient-to-r from-green-600 to-emerald-600 py-2 text-center text-white">
      <p className="text-sm font-semibold">
        🚀 This website is for sale •{' '}
        <Link href="/for-sale" className="underline hover:text-green-100">
          View Details & Make an Offer
        </Link>
      </p>
    </div>
  );
}
