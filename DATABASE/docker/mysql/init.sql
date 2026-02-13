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

-- Orden de borrado
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS friend_requests;
DROP TABLE IF EXISTS memories;
DROP TABLE IF EXISTS expense_splits;
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS trip_members;
DROP TABLE IF EXISTS trips;
DROP TABLE IF EXISTS users;

-- -------------------------
-- USERS
-- -------------------------
CREATE TABLE users (
  user_id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email          VARCHAR(255) NOT NULL,
  user_name      VARCHAR(120) NOT NULL,
  avatar_url     VARCHAR(500) NULL,
  bio            TEXT NULL,
  provider       VARCHAR(20) NOT NULL,
  provider_uid   VARCHAR(255) NULL,
  password_hash  VARCHAR(255) NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (user_id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_provider_uid (provider, provider_uid)
) ENGINE=InnoDB;

-- -------------------------
-- FRIEND REQUESTS
-- -------------------------
CREATE TABLE friend_requests (
  request_id      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  from_user_id    BIGINT UNSIGNED NOT NULL,
  to_user_id      BIGINT UNSIGNED NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (request_id),
  KEY idx_friend_req_from (from_user_id),
  KEY idx_friend_req_to (to_user_id),
  CONSTRAINT fk_friend_req_from FOREIGN KEY (from_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_friend_req_to FOREIGN KEY (to_user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -------------------------
-- MESSAGES
-- -------------------------
CREATE TABLE messages (
  message_id      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  from_user_id    BIGINT UNSIGNED NOT NULL,
  to_user_id      BIGINT UNSIGNED NOT NULL,
  content         TEXT NOT NULL,
  timestamp       VARCHAR(100) NOT NULL,
  is_read         BOOLEAN DEFAULT FALSE,

  PRIMARY KEY (message_id),
  KEY idx_messages_from (from_user_id),
  KEY idx_messages_to (to_user_id),
  CONSTRAINT fk_messages_from FOREIGN KEY (from_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_to FOREIGN KEY (to_user_id) REFERENCES users(user_id) ON DELETE CASCADE
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
  CONSTRAINT fk_trips_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- -------------------------
-- TRIP MEMBERS (CON LA NUEVA COLUMNA STATUS)
-- -------------------------
CREATE TABLE trip_members (
  trip_id    BIGINT UNSIGNED NOT NULL,
  user_id    BIGINT UNSIGNED NOT NULL,
  role       VARCHAR(20) NOT NULL DEFAULT 'member',  -- 'owner'|'member'
  status     VARCHAR(20) NOT NULL DEFAULT 'accepted', -- 'pending'|'accepted'
  joined_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (trip_id, user_id),
  KEY idx_trip_members_user (user_id),
  CONSTRAINT fk_trip_members_trip FOREIGN KEY (trip_id) REFERENCES trips(trip_id) ON DELETE CASCADE,
  CONSTRAINT fk_trip_members_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
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
  CONSTRAINT fk_activities_trip FOREIGN KEY (trip_id) REFERENCES trips(trip_id) ON DELETE CASCADE,
  CONSTRAINT fk_activities_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- -------------------------
-- EXPENSES & SPLITS
-- -------------------------
CREATE TABLE expenses (
  expense_id       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  trip_id          BIGINT UNSIGNED NOT NULL,
  paid_by_user_id  BIGINT UNSIGNED NOT NULL,
  description      VARCHAR(255) NOT NULL,
  amount           DECIMAL(10,2) NOT NULL,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (expense_id),
  CONSTRAINT fk_expenses_trip FOREIGN KEY (trip_id) REFERENCES trips(trip_id) ON DELETE CASCADE,
  CONSTRAINT fk_expenses_paid_by FOREIGN KEY (paid_by_user_id) REFERENCES users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE expense_splits (
  expense_id    BIGINT UNSIGNED NOT NULL,
  user_id       BIGINT UNSIGNED NOT NULL,
  share_amount  DECIMAL(10,2) NOT NULL,

  PRIMARY KEY (expense_id, user_id),
  CONSTRAINT fk_splits_expense FOREIGN KEY (expense_id) REFERENCES expenses(expense_id) ON DELETE CASCADE,
  CONSTRAINT fk_splits_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- -------------------------
-- MEMORIES
-- -------------------------
CREATE TABLE memories (
  memory_id    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  trip_id      BIGINT UNSIGNED NOT NULL,
  user_id      BIGINT UNSIGNED NOT NULL,
  type         VARCHAR(10) NOT NULL,
  description  TEXT NULL,
  media_url    VARCHAR(500) NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (memory_id),
  CONSTRAINT fk_memories_trip FOREIGN KEY (trip_id) REFERENCES trips(trip_id) ON DELETE CASCADE,
  CONSTRAINT fk_memories_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB;


-- =========================================================
-- 3) SEED DATA (DATOS DE PRUEBA)
-- =========================================================

-- USERS
INSERT INTO users (email, user_name, avatar_url, provider, password_hash) VALUES
  ('ana@gmail.com',   'Ana',   'https://i.pravatar.cc/150?u=ana', 'local', '$2b$12$fakehash'), -- ID 1
  ('juan@gmail.com',  'Juan',  'https://i.pravatar.cc/150?u=juan', 'local', '$2b$12$fakehash'), -- ID 2
  ('marta@gmail.com', 'Marta', 'https://i.pravatar.cc/150?u=marta', 'local', '$2b$12$fakehash'); -- ID 3

-- AMIGOS (Ana y Juan ya son amigos)
INSERT INTO friend_requests (from_user_id, to_user_id, status) VALUES (1, 2, 'accepted');

-- TRIPS
INSERT INTO trips (name, destination, origin, start_date, end_date, created_by_user_id) VALUES
  ('Roma 2026', 'Roma', 'Madrid', '2026-04-10', '2026-04-15', 1), -- Creado por Ana
  ('Lisboa Finde', 'Lisboa', 'Sevilla', '2026-05-01', '2026-05-03', 2); -- Creado por Juan

-- TRIP MEMBERS
-- 1. Viaje a Roma (Ana es dueña, Juan aceptado, Marta aceptada)
INSERT INTO trip_members (trip_id, user_id, role, status) VALUES 
  (1, 1, 'owner', 'accepted'),
  (1, 2, 'member', 'accepted'),
  (1, 3, 'member', 'accepted');

-- 2. Viaje a Lisboa (Juan es dueño)
INSERT INTO trip_members (trip_id, user_id, role, status) VALUES 
  (2, 2, 'owner', 'accepted');

-- 🔥 PRUEBA DE NOTIFICACIÓN 🔥
-- Juan invita a Ana a Lisboa, pero está PENDIENTE.
-- Cuando entres como Ana, deberías ver la notificación.
INSERT INTO trip_members (trip_id, user_id, role, status) VALUES 
  (2, 1, 'member', 'pending');