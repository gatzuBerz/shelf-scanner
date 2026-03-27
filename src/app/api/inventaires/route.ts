import { NextRequest, NextResponse } from "next/server";
import { creerInventaire, listerInventaires } from "@/lib/db";

export async function GET() {
  const inventaires = listerInventaires();
  return NextResponse.json(inventaires);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { nom, produits } = body;

  if (!produits || !Array.isArray(produits)) {
    return NextResponse.json({ error: "Produits manquants" }, { status: 400 });
  }

  const inventaire = creerInventaire(nom ?? "Scan sans titre", produits);
  return NextResponse.json(inventaire, { status: 201 });
}
