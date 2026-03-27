import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="max-w-lg text-center">
        <div className="text-6xl mb-6">🛒</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Shelf Scanner</h1>
        <p className="text-lg text-gray-500 mb-8">
          Prends une photo de tes étagères. L&apos;IA génère ton inventaire en quelques secondes.
          Pour les restaurants, supérettes et épiceries.
        </p>
        <Link
          href="/scan"
          className="inline-block bg-blue-600 text-white font-semibold text-lg px-8 py-4 rounded-xl hover:bg-blue-700 transition-colors"
        >
          Scanner maintenant
        </Link>
      </div>
    </div>
  );
}
