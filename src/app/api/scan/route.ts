import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const files = formData.getAll("images") as File[];

  if (!files || files.length === 0) {
    return NextResponse.json({ error: "Aucune image fournie" }, { status: 400 });
  }

  // Convertir toutes les images en base64
  const imageContents = await Promise.all(
    files.map(async (file) => {
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      return {
        type: "image_url" as const,
        image_url: { url: `data:${file.type};base64,${base64}` },
      };
    })
  );

  const nbPhotos = files.length;
  const promptMulti = nbPhotos > 1
    ? `Tu reçois ${nbPhotos} photos de la même zone de stockage prises depuis des angles différents.
Analyse chaque photo attentivement. Certains produits peuvent apparaître sur plusieurs photos : ne les compte qu'une seule fois.
Fusionne et déduplique les résultats pour produire un inventaire unique et cohérent.`
    : `Tu es un assistant d'inventaire pour restaurants et supérettes.
Analyse cette photo d'étagère et liste tous les produits visibles.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `${promptMulti}
Pour chaque produit, donne :
- nom du produit (précis : marque + type si visible)
- quantité estimée (nombre d'unités visibles)
- unité (bouteilles, boîtes, packs, sachets, kg, etc.)

Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans texte avant ou après.
Format :
{
  "produits": [
    { "nom": "...", "quantite": 0, "unite": "..." }
  ]
}`,
          },
          ...imageContents,
        ],
      },
    ],
    max_tokens: 1500,
  });

  const content = response.choices[0].message.content ?? "{}";

  try {
    const data = JSON.parse(content);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Réponse IA invalide", raw: content }, { status: 500 });
  }
}
