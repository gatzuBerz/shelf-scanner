import { NextRequest, NextResponse } from "next/server";
import { getInventaire, supprimerInventaire } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inventaire = getInventaire(Number(id));
  if (!inventaire) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(inventaire);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  supprimerInventaire(Number(id));
  return new NextResponse(null, { status: 204 });
}
