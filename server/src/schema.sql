-- Tables are created only if they do not exist yet, so this file is safe to run on every start.

CREATE TABLE IF NOT EXISTS offers (
  id          INTEGER PRIMARY KEY,
  title       TEXT    NOT NULL,
  city        TEXT    NOT NULL,
  price       INTEGER NOT NULL CHECK (price > 0),
  area        INTEGER NOT NULL CHECK (area > 0),
  rooms       INTEGER NOT NULL,
  beds        INTEGER NOT NULL,
  baths       INTEGER NOT NULL,
  type        TEXT    NOT NULL CHECK (type IN ('Flat', 'Penthouse', 'House')),
  floor       TEXT,
  year        INTEGER,
  terrace     INTEGER NOT NULL DEFAULT 0 CHECK (terrace IN (0, 1)),
  description TEXT,
  created_at  TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS offer_images (
  id       INTEGER PRIMARY KEY,
  offer_id INTEGER NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  url      TEXT    NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);

-- One viewing per offer, day and hour: the database itself refuses a double booking.
CREATE TABLE IF NOT EXISTS viewings (
  id         INTEGER PRIMARY KEY,
  offer_id   INTEGER NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  date       TEXT    NOT NULL,
  time       TEXT    NOT NULL,
  name       TEXT    NOT NULL,
  email      TEXT    NOT NULL,
  message    TEXT,
  created_at TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (offer_id, date, time)
);

CREATE TABLE IF NOT EXISTS messages (
  id         INTEGER PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  phone      TEXT,
  topic      TEXT NOT NULL,
  message    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscribers (
  id         INTEGER PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_offer_images_offer ON offer_images (offer_id, position);
