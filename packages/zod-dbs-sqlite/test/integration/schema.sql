
-- USERS
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','banned')),
  profile JSON,
  created_at TEXT DEFAULT (datetime('now'))
);
