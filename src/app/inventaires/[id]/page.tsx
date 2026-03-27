"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { use } from "react";

type Produit = { id: number; nom: string; quantite: number; unite: string };
type Inventaire = { id: number; nom: string; created_at: string; produits: Produit[] };

export default function InventaireDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [inventaire, setInventaire] = useState<Inventaire | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/inventaires/${id}`)
      .then((r) => r.json())
      .then((data) => { setInventaire(data); setLoading(false); });
  }, [id]);

  function exportCSV() {
    if (!inventaire) return;
    const header = "Produit,Quantité,Unité\n";
    const rows = inventaire.produits.map((p) => `"${p.nom}",${p.quantite},"${p.unite}"`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${inventaire.nom}.csv`;
    a.click();
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Chargement...</div>;
  if (!inventaire) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Inventaire introuvable.</div>;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <Link href="/inventaires" className="text-sm text-blue-600 hover:underline mb-6 inline-block">
          ← Retour à l&apos;historique
        </Link>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{inventaire.nom}</h1>
            <p className="text-gray-400 mt-1 text-sm">
              {new Date(inventaire.created_at).toLocaleDateString("fr-FR", {
                day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </div>
          <button
            onClick={exportCSV}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
          >
            Exporter CSV
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Produit</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Quantité</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Unité</th>
              </tr>
            </thead>
            <tbody>
              {inventaire.produits.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.nom}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{p.quantite}</td>
                  <td className="px-4 py-3 text-gray-500">{p.unite}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-center text-gray-400 text-sm mt-4">
          {inventaire.produits.length} produit{inventaire.produits.length > 1 ? "s" : ""} au total
        </p>
      </div>
    </div>
  );
}
