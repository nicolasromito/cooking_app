import * as SQLite from "expo-sqlite";

let dbPromise = null;

/**
 * Devuelve la conexión a la base local, creándola (y sus tablas) la
 * primera vez que se usa. Las llamadas siguientes reciben la misma
 * conexión ya abierta.
 */
export function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync("cookingapp.db").then(async (db) => {
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS recipes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          servings INTEGER DEFAULT 1,
          prep_time_minutes INTEGER DEFAULT 0,
          cook_time_minutes INTEGER DEFAULT 0,
          difficulty TEXT DEFAULT 'easy',
          image_uri TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS ingredients (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          recipe_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          quantity TEXT,
          unit TEXT,
          order_index INTEGER DEFAULT 0,
          FOREIGN KEY (recipe_id) REFERENCES recipes (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS steps (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          recipe_id INTEGER NOT NULL,
          order_index INTEGER NOT NULL,
          description TEXT NOT NULL,
          FOREIGN KEY (recipe_id) REFERENCES recipes (id) ON DELETE CASCADE
        );
      `);
      return db;
    });
  }
  return dbPromise;
}