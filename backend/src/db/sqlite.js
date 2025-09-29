const Database = require('better-sqlite3');
const path = require('path');

// Create database file in the backend directory
const dbPath = path.join(__dirname, '../../database.sqlite');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
const createTables = () => {
  // Temples table
  db.exec(`
    CREATE TABLE IF NOT EXISTS temples (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      currentOccupancy INTEGER DEFAULT 0,
      status TEXT DEFAULT 'normal',
      coordinates TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Queue entries table
  db.exec(`
    CREATE TABLE IF NOT EXISTS queue_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      templeId INTEGER NOT NULL,
      tokenNumber INTEGER NOT NULL,
      visitorName TEXT NOT NULL,
      visitorPhone TEXT,
      estimatedWaitTime INTEGER,
      status TEXT DEFAULT 'waiting',
      priority TEXT DEFAULT 'normal',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (templeId) REFERENCES temples(id),
      UNIQUE(templeId, tokenNumber)
    )
  `);

  // Emergencies table
  db.exec(`
    CREATE TABLE IF NOT EXISTS emergencies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      templeId INTEGER NOT NULL,
      type TEXT NOT NULL,
      severity TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'reported',
      reportedBy TEXT,
      reporterPhone TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (templeId) REFERENCES temples(id)
    )
  `);

  // Crowd analytics table
  db.exec(`
    CREATE TABLE IF NOT EXISTS crowd_analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      templeId INTEGER NOT NULL,
      crowdCount INTEGER NOT NULL,
      density REAL NOT NULL,
      alertLevel TEXT DEFAULT 'low',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (templeId) REFERENCES temples(id)
    )
  `);

  // Insert sample data
  const templeExists = db.prepare('SELECT COUNT(*) as count FROM temples').get();
  if (templeExists.count === 0) {
    const insertTemple = db.prepare(`
      INSERT INTO temples (name, location, capacity, currentOccupancy, coordinates)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertTemple.run('Somnath Temple', 'Prabhas Patan, Veraval, Gir Somnath District, Gujarat 362268', 5000, 1250, '20.8880,70.4017');
    insertTemple.run('Dwarkadhish Temple', 'Dwarka, Devbhumi Dwarka District, Gujarat 361335', 3000, 800, '22.2394,68.9678');
    insertTemple.run('Ambaji Temple', 'Ambaji, Banaskantha District, Gujarat 385110', 4000, 1200, '24.2120,72.8677');

    // Insert sample analytics data
    const insertAnalytics = db.prepare(`
      INSERT INTO crowd_analytics (templeId, crowdCount, density, alertLevel, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `);

    const now = new Date();
    const temples = db.prepare('SELECT id FROM temples').all();

    temples.forEach(temple => {
      for (let i = 0; i < 24; i++) {
        const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000)); // Last 24 hours
        const crowdCount = Math.floor(Math.random() * 2000) + 500;
        const density = Math.min(100, (crowdCount / 5000) * 100);
        const alertLevel = density >= 90 ? 'critical' : density >= 75 ? 'high' : density >= 50 ? 'medium' : 'low';

        insertAnalytics.run(temple.id, crowdCount, density, alertLevel, timestamp.toISOString());
      }
    });
  }
};

// Initialize database
createTables();

module.exports = db;