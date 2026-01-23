import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="mb-4 text-4xl font-bold">Topic Not Found</h1>
      <p className="mb-8 text-lg text-gray-600">
        We couldn&apos;t find this topic on either Wikipedia or Grokipedia.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
      >
        Go Home
      </Link>
    </div>
  );
}
