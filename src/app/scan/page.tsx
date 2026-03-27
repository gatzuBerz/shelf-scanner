"use client";

import { useState, useRef } from "react";
import Link from "next/link";

type Produit = {
  nom: string;
  quantite: number;
  unite: string;
};

export default function ScanPage() {
  const [images, setImages] = useState<{ file: File; url: string }[]>([]);
  const [produits, setProduits] = useState<Produit[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nomScan, setNomScan] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | File[]) {
    const newImages = Array.from(files).map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setImages((prev) => [...prev, ...newImages]);
    setProduits(null);
    setError(null);
    setSaved(false);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) handleFiles(e.target.files);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  }

  function retirerImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function analyser() {
    if (images.length === 0) return;
    setLoading(true);
    setError(null);
    setProduits(null);
    setSaved(false);

    const formData = new FormData();
    images.forEach(({ file }) => formData.append("images", file));

    try {
      const res = await fetch("/api/scan", { method: "POST", body: formData });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setProduits(data.produits ?? []);
      }
    } catch {
      setError("Erreur réseau, réessaie.");
    } finally {
      setLoading(false);
    }
  }

  function updateProduit(index: number, field: keyof Produit, value: string | number) {
    setProduits((prev) => {
      if (!prev) return prev;
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function supprimerProduit(index: number) {
    setProduits((prev) => prev ? prev.filter((_, i) => i !== index) : prev);
  }

  function ajouterProduit() {
    setProduits((prev) => prev ? [...prev, { nom: "", quantite: 1, unite: "unité" }] : prev);
  }

  async function sauvegarder() {
    if (!produits) return;
    setSaving(true);
    try {
      const res = await fetch("/api/inventaires", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: nomScan.trim() || `Scan du ${new Date().toLocaleDateString("fr-FR")}`,
          produits: produits.filter((p) => p.nom.trim() !== ""),
        }),
      });
      if (res.ok) setSaved(true);
    } catch {
      setError("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  function exportCSV() {
    if (!produits) return;
    const header = "Produit,Quantité,Unité\n";
    const rows = produits.map((p) => `"${p.nom}",${p.quantite},"${p.unite}"`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventaire-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  function reset() {
    setImages([]);
    setProduits(null);
    setSaved(false);
    setNomScan("");
    setError(null);
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Scanner une étagère</h1>
          <Link href="/inventaires" className="text-sm text-blue-600 hover:underline">
            Voir l&apos;historique →
          </Link>
        </div>
        <p className="text-gray-500 mb-8">
          Ajoute une ou plusieurs photos — l&apos;IA fusionne les vues et génère un inventaire unique.
        </p>

        {/* Zone upload */}
        <div
          className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
          onClick={() => inputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {images.length === 0 ? (
            <div className="text-gray-400 py-4">
              <div className="text-5xl mb-3">📷</div>
              <p className="font-medium text-gray-600">Clique ou glisse des photos ici</p>
              <p className="text-sm mt-1">Plusieurs photos autorisées — JPG, PNG, WEBP</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3 justify-center">
              {images.map((img, i) => (
                <div key={i} className="relative group">
                  <img
                    src={img.url}
                    alt={`Photo ${i + 1}`}
                    className="h-28 w-28 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); retirerImage(i); }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <div className="h-28 w-28 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-3xl hover:border-blue-400 transition-colors">
                +
              </div>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onInputChange}
          />
        </div>

        {images.length > 0 && (
          <div className="mt-4 flex gap-3">
            <button
              onClick={analyser}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading
                ? "Analyse en cours..."
                : images.length > 1
                ? `Analyser ${images.length} photos`
                : "Analyser l'inventaire"}
            </button>
            <button
              onClick={reset}
              className="px-4 py-3 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Reset
            </button>
          </div>
        )}

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Résultats éditables */}
        {produits && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Inventaire ({produits.length} produits)
              </h2>
              <button
                onClick={exportCSV}
                className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Exporter CSV
              </button>
            </div>

            {produits.length === 0 ? (
              <p className="text-gray-500">Aucun produit détecté. Essaie avec une photo plus nette.</p>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Produit</th>
                      <th className="text-right px-3 py-3 font-semibold text-gray-600 w-20">Qté</th>
                      <th className="text-left px-3 py-3 font-semibold text-gray-600 w-24">Unité</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {produits.map((p, i) => (
                      <tr key={i} className="border-b border-gray-100 last:border-0">
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={p.nom}
                            onChange={(e) => updateProduit(i, "nom", e.target.value)}
                            className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none py-0.5 text-gray-900 font-medium"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={0}
                            step={0.5}
                            value={p.quantite}
                            onChange={(e) => updateProduit(i, "quantite", parseFloat(e.target.value) || 0)}
                            className="w-full text-right bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none py-0.5 text-gray-700"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={p.unite}
                            onChange={(e) => updateProduit(i, "unite", e.target.value)}
                            className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none py-0.5 text-gray-500"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <button
                            onClick={() => supprimerProduit(i)}
                            className="text-gray-300 hover:text-red-500 transition-colors"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  onClick={ajouterProduit}
                  className="w-full text-sm text-gray-400 hover:text-blue-600 hover:bg-blue-50 py-2.5 transition-colors border-t border-gray-100"
                >
                  + Ajouter un produit
                </button>
              </div>
            )}

            {/* Sauvegarde */}
            {!saved ? (
              <div className="bg-white border border-gray-200 rounded-xl p-4 flex gap-3">
                <input
                  type="text"
                  placeholder={`Scan du ${new Date().toLocaleDateString("fr-FR")}`}
                  value={nomScan}
                  onChange={(e) => setNomScan(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sauvegarder}
                  disabled={saving}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? "Sauvegarde..." : "Sauvegarder"}
                </button>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center justify-between">
                <span>✓ Inventaire sauvegardé et stock mis à jour</span>
                <Link href="/inventaires" className="text-sm font-semibold hover:underline">
                  Voir l&apos;historique →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
