-- =========================================================
-- 1) DATABASE
-- =========================================================
DROP DATABASE IF EXISTS trip_share_db;
CREATE DATABASE trip_share_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE trip_share_db;

-- =========================================================
-- 2) TABLES
-- =========================================================

-- -------------------------
-- USERS
-- -------------------------
DROP TABLE IF EXISTS trip_invites;
DROP TABLE IF EXISTS memories;
DROP TABLE IF EXISTS expense_splits;
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS trip_members;
DROP TABLE IF EXISTS trips;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  user_id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email          VARCHAR(255) NOT NULL,
  user_name      VARCHAR(120) NOT NULL,
  avatar_url     VARCHAR(500) NULL,
  bio            TEXT NULL,

  -- Auth related
  provider       VARCHAR(20) NOT NULL,   -- 'google' | 'local'
  provider_uid   VARCHAR(255) NULL,      -- if provider='google'
  password_hash  VARCHAR(255) NULL,      -- if provider='local'

  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (user_id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_provider_uid (provider, provider_uid)
) ENGINE=InnoDB;

-- -------------------------
-- TRIPS
-- -------------------------
CREATE TABLE trips (
  trip_id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name               VARCHAR(120) NOT NULL,
  destination        VARCHAR(120) NOT NULL,
  origin             VARCHAR(120) NULL,
  start_date         DATE NOT NULL,
  end_date           DATE NOT NULL,
  created_by_user_id BIGINT UNSIGNED NOT NULL,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (trip_id),
  KEY idx_trips_created_by (created_by_user_id),
  CONSTRAINT fk_trips_created_by
    FOREIGN KEY (created_by_user_id) REFERENCES users(user_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -------------------------
-- TRIP MEMBERS (USERS_TRIPS)
-- -------------------------
CREATE TABLE trip_members (
  trip_id    BIGINT UNSIGNED NOT NULL,
  user_id    BIGINT UNSIGNED NOT NULL,
  role       VARCHAR(20) NOT NULL DEFAULT 'member',  -- 'owner'|'member'
  joined_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (trip_id, user_id),
  KEY idx_trip_members_user (user_id),

  CONSTRAINT fk_trip_members_trip
    FOREIGN KEY (trip_id) REFERENCES trips(trip_id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_trip_members_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -------------------------
-- ACTIVITIES
-- -------------------------
CREATE TABLE activities (
  activity_id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  trip_id             BIGINT UNSIGNED NOT NULL,
  created_by_user_id  BIGINT UNSIGNED NOT NULL,

  title               VARCHAR(160) NOT NULL,
  description         TEXT NULL,
  location            VARCHAR(200) NULL,
  start_datetime      DATETIME NOT NULL,
  end_datetime        DATETIME NOT NULL,

  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (activity_id),
  KEY idx_activities_trip (trip_id),
  KEY idx_activities_created_by (created_by_user_id),
  KEY idx_activities_start (start_datetime),

  CONSTRAINT fk_activities_trip
    FOREIGN KEY (trip_id) REFERENCES trips(trip_id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_activities_created_by
    FOREIGN KEY (created_by_user_id) REFERENCES users(user_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -------------------------
-- EXPENSES
-- -------------------------
CREATE TABLE expenses (
  expense_id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  trip_id           BIGINT UNSIGNED NOT NULL,
  paid_by_user_id   BIGINT UNSIGNED NOT NULL,

  description       VARCHAR(255) NOT NULL,
  amount            DECIMAL(10,2) NOT NULL,

  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (expense_id),
  KEY idx_expenses_trip (trip_id),
  KEY idx_expenses_paid_by (paid_by_user_id),

  CONSTRAINT fk_expenses_trip
    FOREIGN KEY (trip_id) REFERENCES trips(trip_id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_expenses_paid_by
    FOREIGN KEY (paid_by_user_id) REFERENCES users(user_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -------------------------
-- EXPENSE SPLITS
-- -------------------------
CREATE TABLE expense_splits (
  expense_id     BIGINT UNSIGNED NOT NULL,
  user_id        BIGINT UNSIGNED NOT NULL,
  share_amount   DECIMAL(10,2) NOT NULL,

  PRIMARY KEY (expense_id, user_id),
  KEY idx_splits_user (user_id),

  CONSTRAINT fk_splits_expense
    FOREIGN KEY (expense_id) REFERENCES expenses(expense_id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_splits_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -------------------------
-- MEMORIES (photo/video/note)
-- -------------------------
CREATE TABLE memories (
  memory_id     BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  trip_id       BIGINT UNSIGNED NOT NULL,
  user_id       BIGINT UNSIGNED NOT NULL,

  type          VARCHAR(10) NOT NULL,        -- 'photo'|'video'|'note'
  description   TEXT NULL,
  media_url     VARCHAR(500) NULL,           -- NULL for notes
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (memory_id),
  KEY idx_memories_trip (trip_id),
  KEY idx_memories_user (user_id),
  KEY idx_memories_created_at (created_at),

  CONSTRAINT fk_memories_trip
    FOREIGN KEY (trip_id) REFERENCES trips(trip_id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_memories_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -------------------------
-- TRIP INVITES
-- -------------------------
CREATE TABLE trip_invites (
  invite_id    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  trip_id      BIGINT UNSIGNED NOT NULL,
  email        VARCHAR(255) NOT NULL,
  token        VARCHAR(64) NOT NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending|accepted|revoked
  expires_at   DATETIME NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (invite_id),
  UNIQUE KEY uq_invites_token (token),
  KEY idx_invites_trip (trip_id),
  KEY idx_invites_email (email),

  CONSTRAINT fk_invites_trip
    FOREIGN KEY (trip_id) REFERENCES trips(trip_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;


-- =========================================================
-- 3) TEST INSERTS (SEED)
-- =========================================================

-- USERS
INSERT INTO users (email, user_name, avatar_url, bio, provider, provider_uid, password_hash)
VALUES
  ('ana@gmail.com',   'Ana',   'https://pics.example/ana.jpg',   'Me encanta viajar', 'google', 'google_ana_001', NULL),
  ('juan@gmail.com',  'Juan',  'https://pics.example/juan.jpg',  NULL,               'local',  NULL,            '$2b$12$fakehashjuan'),
  ('marta@gmail.com', 'Marta', NULL,                             'Foodie',           'google', 'google_marta_002', NULL),
  ('pablo@gmail.com', 'Pablo', NULL,                             NULL,              'local',  NULL,            '$2b$12$fakehashpablo');

-- TRIPS
INSERT INTO trips (name, destination, origin, start_date, end_date, created_by_user_id)
VALUES
  ('Roma 2026', 'Roma', 'Madrid', '2026-04-10', '2026-04-15', 1),
  ('Lisboa finde', 'Lisboa', 'Sevilla', '2026-02-07', '2026-02-09', 2);

-- TRIP MEMBERS
INSERT INTO trip_members (trip_id, user_id, role)
VALUES
  (1, 1, 'owner'),
  (1, 2, 'member'),
  (1, 3, 'member'),
  (2, 2, 'owner'),
  (2, 4, 'member');

-- ACTIVITIES (trip 1: Roma)
INSERT INTO activities (trip_id, created_by_user_id, title, description, location, start_datetime, end_datetime)
VALUES
  (1, 1, 'Llegada y check-in', 'Dejar maletas y descansar', 'Hotel Centro', '2026-04-10 16:00:00', '2026-04-10 17:00:00'),
  (1, 2, 'Coliseo', 'Entrada reservada', 'Coliseo', '2026-04-11 10:00:00', '2026-04-11 12:00:00'),
  (1, 3, 'Cena Trastevere', 'Buscar sitio con pasta', 'Trastevere', '2026-04-11 20:30:00', '2026-04-11 22:00:00');

-- EXPENSES + SPLITS
-- Expense 1 (trip 1): Cena 60 pagó Ana (user 1) dividido entre 3 (20 cada uno)
INSERT INTO expenses (trip_id, paid_by_user_id, description, amount)
VALUES (1, 1, 'Cena (Trastevere)', 60.00);

-- expense_id autogenerado = 1 (si estáis en BD limpia). Para estar 100% seguros:
SET @exp1 := LAST_INSERT_ID();

INSERT INTO expense_splits (expense_id, user_id, share_amount)
VALUES
  (@exp1, 1, 20.00),
  (@exp1, 2, 20.00),
  (@exp1, 3, 20.00);

-- Expense 2 (trip 1): Entradas Coliseo 75 pagó Juan (user 2) dividido entre 3 (25 cada uno)
INSERT INTO expenses (trip_id, paid_by_user_id, description, amount)
VALUES (1, 2, 'Entradas Coliseo', 75.00);

SET @exp2 := LAST_INSERT_ID();

INSERT INTO expense_splits (expense_id, user_id, share_amount)
VALUES
  (@exp2, 1, 25.00),
  (@exp2, 2, 25.00),
  (@exp2, 3, 25.00);

-- Expense 3 (trip 2): Uber 18 pagó Juan (user 2) dividido entre 2 (9 cada uno)
INSERT INTO expenses (trip_id, paid_by_user_id, description, amount)
VALUES (2, 2, 'Uber aeropuerto', 18.00);

SET @exp3 := LAST_INSERT_ID();

INSERT INTO expense_splits (expense_id, user_id, share_amount)
VALUES
  (@exp3, 2, 9.00),
  (@exp3, 4, 9.00);

-- MEMORIES
-- Trip 1: una nota (sin media_url), una foto, un video
INSERT INTO memories (trip_id, user_id, type, description, media_url)
VALUES
  (1, 1, 'note',  'Primer día: hemos llegado y todo perfecto.', NULL),
  (1, 2, 'photo', 'Atardecer desde el puente', 'https://media.example/roma/atardecer.jpg'),
  (1, 3, 'video', 'Mini resumen del Coliseo', 'https://media.example/roma/coliseo.mp4');

-- TRIP INVITES (ejemplo: invitar a alguien que aún no existe como user)
INSERT INTO trip_invites (trip_id, email, token, status, expires_at)
VALUES
  (1, 'amigo1@example.com', 'tok_roma_0001', 'pending', '2026-03-31 23:59:59'),
  (2, 'amigo2@example.com', 'tok_lisboa_0001', 'pending', '2026-02-01 23:59:59');

-- =========================================================
-- FIN
-- =========================================================


 