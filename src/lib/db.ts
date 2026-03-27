import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "shelf-scanner.db");

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.exec(`
      CREATE TABLE IF NOT EXISTS inventaires (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL DEFAULT 'Scan sans titre',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS produits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        inventaire_id INTEGER NOT NULL REFERENCES inventaires(id) ON DELETE CASCADE,
        nom TEXT NOT NULL,
        quantite REAL NOT NULL,
        unite TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS stock (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        quantite REAL NOT NULL,
        unite TEXT NOT NULL,
        date TEXT NOT NULL,
        inventaire_id INTEGER REFERENCES inventaires(id) ON DELETE SET NULL
      );

      CREATE INDEX IF NOT EXISTS idx_stock_date ON stock(date);
      CREATE INDEX IF NOT EXISTS idx_stock_nom_date ON stock(nom, date);
    `);
  }
  return db;
}

export type Produit = {
  id?: number;
  inventaire_id?: number;
  nom: string;
  quantite: number;
  unite: string;
};

export type Inventaire = {
  id: number;
  nom: string;
  created_at: string;
  produits?: Produit[];
};

export type LignStock = {
  nom: string;
  quantite: number;
  unite: string;
  date: string;
};

export function creerInventaire(nom: string, produits: Omit<Produit, "id" | "inventaire_id">[]): Inventaire {
  const db = getDb();

  const insert = db.prepare("INSERT INTO inventaires (nom) VALUES (?)");
  const result = insert.run(nom);
  const inventaireId = result.lastInsertRowid as number;

  const insertProduit = db.prepare(
    "INSERT INTO produits (inventaire_id, nom, quantite, unite) VALUES (?, ?, ?, ?)"
  );

  // Date du jour YYYY-MM-DD
  const today = new Date().toISOString().slice(0, 10);

  // Supprimer les entrées stock d'aujourd'hui pour les produits de ce scan
  // puis insérer les nouvelles (upsert par nom+date)
  const deleteTodayStock = db.prepare(
    "DELETE FROM stock WHERE date = ? AND nom = ?"
  );
  const insertStock = db.prepare(
    "INSERT INTO stock (nom, quantite, unite, date, inventaire_id) VALUES (?, ?, ?, ?, ?)"
  );

  const insertMany = db.transaction((items: Omit<Produit, "id" | "inventaire_id">[]) => {
    for (const p of items) {
      insertProduit.run(inventaireId, p.nom, p.quantite, p.unite);
      deleteTodayStock.run(today, p.nom);
      insertStock.run(p.nom, p.quantite, p.unite, today, inventaireId);
    }
  });

  insertMany(produits);

  return getInventaire(inventaireId)!;
}

export function getInventaire(id: number): Inventaire | null {
  const db = getDb();
  const inv = db.prepare("SELECT * FROM inventaires WHERE id = ?").get(id) as Inventaire | undefined;
  if (!inv) return null;
  inv.produits = db.prepare("SELECT * FROM produits WHERE inventaire_id = ?").all(id) as Produit[];
  return inv;
}

export function listerInventaires(): Inventaire[] {
  const db = getDb();
  const inventaires = db.prepare(
    "SELECT i.*, COUNT(p.id) as nb_produits FROM inventaires i LEFT JOIN produits p ON p.inventaire_id = i.id GROUP BY i.id ORDER BY i.created_at DESC"
  ).all() as (Inventaire & { nb_produits: number })[];
  return inventaires;
}

export function supprimerInventaire(id: number): void {
  const db = getDb();
  db.prepare("DELETE FROM inventaires WHERE id = ?").run(id);
}

// Retourne le stock à une date donnée (carry-forward : dernière valeur connue ≤ date)
export function getStockALaDate(date: string): LignStock[] {
  const db = getDb();
  // Pour chaque produit unique, prendre la valeur la plus récente ≤ date
  const rows = db.prepare(`
    SELECT s.nom, s.quantite, s.unite, s.date
    FROM stock s
    INNER JOIN (
      SELECT nom, MAX(date) as max_date
      FROM stock
      WHERE date <= ?
      GROUP BY nom
    ) latest ON s.nom = latest.nom AND s.date = latest.max_date
    ORDER BY s.nom ASC
  `).all(date) as LignStock[];
  return rows;
}

// Retourne la liste des dates qui ont au moins un scan
export function getDatesAvecScan(): string[] {
  const db = getDb();
  const rows = db.prepare(
    "SELECT DISTINCT DATE(created_at) as date FROM inventaires ORDER BY date DESC"
  ).all() as { date: string }[];
  return rows.map((r) => r.date);
}

export type Stats = {
  totalScans: number;
  totalProduits: number;
  produitsTop: { nom: string; occurrences: number; quantite_totale: number }[];
  scansParJour: { date: string; nb: number }[];
  derniersScans: { id: number; nom: string; created_at: string; nb_produits: number }[];
};

export function getStats(): Stats {
  const db = getDb();

  const totalScans = (db.prepare("SELECT COUNT(*) as n FROM inventaires").get() as { n: number }).n;
  const totalProduits = (db.prepare("SELECT COUNT(*) as n FROM produits").get() as { n: number }).n;

  const produitsTop = db.prepare(`
    SELECT nom, COUNT(*) as occurrences, SUM(quantite) as quantite_totale
    FROM produits
    GROUP BY LOWER(nom)
    ORDER BY occurrences DESC, quantite_totale DESC
    LIMIT 5
  `).all() as Stats["produitsTop"];

  const scansParJour = db.prepare(`
    SELECT DATE(created_at) as date, COUNT(*) as nb
    FROM inventaires
    WHERE created_at >= DATE('now', '-7 days')
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `).all() as Stats["scansParJour"];

  const derniersScans = db.prepare(`
    SELECT i.id, i.nom, i.created_at, COUNT(p.id) as nb_produits
    FROM inventaires i
    LEFT JOIN produits p ON p.inventaire_id = i.id
    GROUP BY i.id
    ORDER BY i.created_at DESC
    LIMIT 5
  `).all() as Stats["derniersScans"];

  return { totalScans, totalProduits, produitsTop, scansParJour, derniersScans };
}
