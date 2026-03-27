"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Inventaire = {
  id: number;
  nom: string;
  created_at: string;
  nb_produits: number;
};

export default function InventairesPage() {
  const [inventaires, setInventaires] = useState<Inventaire[]>([]);
  const [loading, setLoading] = useState(true);

  async function charger() {
    const res = await fetch("/api/inventaires");
    const data = await res.json();
    setInventaires(data);
    setLoading(false);
  }

  async function supprimer(id: number) {
    await fetch(`/api/inventaires/${id}`, { method: "DELETE" });
    setInventaires((prev) => prev.filter((i) => i.id !== id));
  }

  useEffect(() => { charger(); }, []);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Historique</h1>
          <Link
            href="/scan"
            className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors text-sm"
          >
            + Nouveau scan
          </Link>
        </div>

        {loading ? (
          <p className="text-gray-400">Chargement...</p>
        ) : inventaires.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">📋</div>
            <p className="font-medium">Aucun inventaire sauvegardé</p>
            <Link href="/scan" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
              Faire un premier scan →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {inventaires.map((inv) => (
              <div
                key={inv.id}
                className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between hover:border-blue-200 transition-colors"
              >
                <Link href={`/inventaires/${inv.id}`} className="flex-1">
                  <p className="font-semibold text-gray-900">{inv.nom}</p>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {new Date(inv.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" · "}
                    {inv.nb_produits} produit{inv.nb_produits > 1 ? "s" : ""}
                  </p>
                </Link>
                <button
                  onClick={() => supprimer(inv.id)}
                  className="ml-4 text-gray-300 hover:text-red-500 transition-colors text-lg"
                  title="Supprimer"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
