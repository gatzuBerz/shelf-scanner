"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Stats = {
  totalScans: number;
  totalProduits: number;
  produitsTop: { nom: string; occurrences: number; quantite_totale: number }[];
  scansParJour: { date: string; nb: number }[];
  derniersScans: { id: number; nom: string; created_at: string; nb_produits: number }[];
};

type LignStock = {
  nom: string;
  quantite: number;
  unite: string;
  date: string;
};

type StockResponse = {
  date: string;
  stock: LignStock[];
  datesAvecScan: string[];
};

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-6 py-5">
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function BarChart({ data }: { data: { date: string; nb: number }[] }) {
  if (data.length === 0) {
    return <p className="text-gray-400 text-sm py-4 text-center">Aucune donnée sur 7 jours</p>;
  }
  const max = Math.max(...data.map((d) => d.nb), 1);
  const days: { date: string; nb: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const found = data.find((x) => x.date === dateStr);
    days.push({ date: dateStr, nb: found?.nb ?? 0 });
  }
  return (
    <div className="flex items-end gap-2 h-28 mt-4">
      {days.map((d) => (
        <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-md bg-blue-500 transition-all"
            style={{ height: `${(d.nb / max) * 100}%`, minHeight: d.nb > 0 ? "6px" : "2px", opacity: d.nb > 0 ? 1 : 0.2 }}
          />
          <span className="text-xs text-gray-400">
            {new Date(d.date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short" })}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [stockData, setStockData] = useState<StockResponse | null>(null);
  const [dateSelectionnee, setDateSelectionnee] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setStats);
  }, []);

  useEffect(() => {
    fetch(`/api/stock?date=${dateSelectionnee}`)
      .then((r) => r.json())
      .then(setStockData);
  }, [dateSelectionnee]);

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">
        Chargement...
      </div>
    );
  }

  const stockDuJour = stockData?.stock ?? [];
  const datesAvecScan = stockData?.datesAvecScan ?? [];
  const dateAffichee = new Date(dateSelectionnee + "T12:00:00").toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <Link
            href="/scan"
            className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors text-sm"
          >
            + Nouveau scan
          </Link>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <KpiCard label="Scans total" value={stats.totalScans} />
          <KpiCard label="Produits recensés" value={stats.totalProduits} sub="toutes sessions confondues" />
        </div>

        {/* Vue stock par date */}
        <div className="bg-white border border-gray-200 rounded-xl px-6 py-5 mb-8">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 className="font-semibold text-gray-700">Stock à une date</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Affiche le dernier inventaire connu à la date sélectionnée
              </p>
            </div>
            <input
              type="date"
              value={dateSelectionnee}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDateSelectionnee(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {stockDuJour.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">Aucune donnée de stock pour le {dateAffichee}.</p>
              {datesAvecScan.length > 0 && (
                <p className="text-xs mt-2">
                  Premier scan disponible le{" "}
                  {new Date(datesAvecScan[datesAvecScan.length - 1] + "T12:00:00").toLocaleDateString("fr-FR")}
                </p>
              )}
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-400 mb-3">
                {dateAffichee}
                {datesAvecScan.includes(dateSelectionnee)
                  ? " · scan effectué ce jour"
                  : ` · données du ${new Date(stockDuJour[0].date + "T12:00:00").toLocaleDateString("fr-FR")}`}
              </p>
              <div className="overflow-hidden rounded-lg border border-gray-100">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Produit</th>
                      <th className="text-right px-4 py-2.5 font-semibold text-gray-500">Quantité</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Unité</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockDuJour.map((ligne, i) => (
                      <tr key={i} className="border-b border-gray-50 last:border-0">
                        <td className="px-4 py-2.5 font-medium text-gray-800">{ligne.nom}</td>
                        <td className="px-4 py-2.5 text-right text-gray-700">{ligne.quantite}</td>
                        <td className="px-4 py-2.5 text-gray-400">{ligne.unite}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-right">
                {stockDuJour.length} produit{stockDuJour.length > 1 ? "s" : ""}
              </p>
            </>
          )}
        </div>

        {/* Activité 7 jours */}
        <div className="bg-white border border-gray-200 rounded-xl px-6 py-5 mb-8">
          <h2 className="font-semibold text-gray-700 mb-1">Scans des 7 derniers jours</h2>
          <BarChart data={stats.scansParJour} />
        </div>

        {/* Top produits */}
        <div className="bg-white border border-gray-200 rounded-xl px-6 py-5 mb-8">
          <h2 className="font-semibold text-gray-700 mb-4">Produits les plus fréquents</h2>
          {stats.produitsTop.length === 0 ? (
            <p className="text-gray-400 text-sm">Aucune donnée</p>
          ) : (
            <div className="flex flex-col gap-3">
              {stats.produitsTop.map((p, i) => {
                const max = stats.produitsTop[0].occurrences;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-800">{p.nom}</span>
                      <span className="text-gray-400">{p.occurrences}× · {p.quantite_totale} unités</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(p.occurrences / max) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Derniers scans */}
        <div className="bg-white border border-gray-200 rounded-xl px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700">Derniers scans</h2>
            <Link href="/inventaires" className="text-sm text-blue-600 hover:underline">Tout voir →</Link>
          </div>
          {stats.derniersScans.length === 0 ? (
            <p className="text-gray-400 text-sm">Aucun scan enregistré</p>
          ) : (
            <div className="flex flex-col divide-y divide-gray-100">
              {stats.derniersScans.map((s) => (
                <Link
                  key={s.id}
                  href={`/inventaires/${s.id}`}
                  className="py-3 flex items-center justify-between hover:text-blue-600 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{s.nom}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(s.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">{s.nb_produits} produits</span>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
