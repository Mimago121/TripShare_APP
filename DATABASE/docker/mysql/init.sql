-- =========================================================
-- 1) DATABASE SETUP
-- =========================================================
DROP DATABASE IF EXISTS trip_share_db;
CREATE DATABASE trip_share_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE trip_share_db;

-- =========================================================
-- 2) CLEANUP (DROP TABLES)
-- =========================================================
DROP TABLE IF EXISTS expense_splits;
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS memories;
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS trip_members;
DROP TABLE IF EXISTS trip_messages; -- Ojo: borramos también esta si existe
DROP TABLE IF EXISTS visited_places;
DROP TABLE IF EXISTS trips;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS friend_requests;
DROP TABLE IF EXISTS users;

-- =========================================================
-- 3) CREATE TABLES
-- =========================================================

-- 1. USERS (Con columna ROLE añadida)
CREATE TABLE users (
  user_id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email          VARCHAR(255) NOT NULL,
  user_name      VARCHAR(120) NOT NULL,
  avatar_url     LONGTEXT NULL,
  bio            TEXT NULL,
  provider       VARCHAR(20) NOT NULL DEFAULT 'local',
  provider_uid   VARCHAR(255) NULL,
  password_hash  VARCHAR(255) NULL,
  role           VARCHAR(20) NOT NULL DEFAULT 'user', -- <--- NUEVO: Rol (admin/user)
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (user_id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

-- 2. FRIEND REQUESTS
CREATE TABLE friend_requests (
  request_id      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  from_user_id    BIGINT UNSIGNED NOT NULL,
  to_user_id      BIGINT UNSIGNED NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (request_id),
  CONSTRAINT fk_friend_req_from FOREIGN KEY (from_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_friend_req_to FOREIGN KEY (to_user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. MESSAGES (Chat privado)
CREATE TABLE messages (
  message_id      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  from_user_id    BIGINT UNSIGNED NOT NULL,
  to_user_id      BIGINT UNSIGNED NOT NULL,
  content         TEXT NOT NULL,
  timestamp       VARCHAR(100) NOT NULL,
  is_read         BOOLEAN DEFAULT FALSE,

  PRIMARY KEY (message_id),
  CONSTRAINT fk_messages_from FOREIGN KEY (from_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_to FOREIGN KEY (to_user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. VISITED PLACES
CREATE TABLE visited_places (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id         BIGINT UNSIGNED NOT NULL,
  name            VARCHAR(255) NOT NULL,
  latitude        DOUBLE NOT NULL,
  longitude       DOUBLE NOT NULL,

  PRIMARY KEY (id),
  CONSTRAINT fk_visited_places_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. TRIPS (Con image_url explícito)
CREATE TABLE trips (
  trip_id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name               VARCHAR(120) NOT NULL,
  destination        VARCHAR(120) NOT NULL,
  origin             VARCHAR(120) NULL,
  start_date         DATE NOT NULL,
  end_date           DATE NOT NULL,
  created_by_user_id BIGINT UNSIGNED NOT NULL,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  image_url          TEXT NULL, -- <--- Acepta NULL para cuando no hay foto

  PRIMARY KEY (trip_id),
  CONSTRAINT fk_trips_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 6. TRIP MEMBERS
CREATE TABLE trip_members (
  trip_id    BIGINT UNSIGNED NOT NULL,
  user_id    BIGINT UNSIGNED NOT NULL,
  role       VARCHAR(20) NOT NULL DEFAULT 'member',
  status     VARCHAR(20) NOT NULL DEFAULT 'accepted',
  joined_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (trip_id, user_id),
  CONSTRAINT fk_trip_members_trip FOREIGN KEY (trip_id) REFERENCES trips(trip_id) ON DELETE CASCADE,
  CONSTRAINT fk_trip_members_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. ACTIVITIES
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
  CONSTRAINT fk_activities_trip FOREIGN KEY (trip_id) REFERENCES trips(trip_id) ON DELETE CASCADE,
  CONSTRAINT fk_activities_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 8. EXPENSES
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

-- 9. EXPENSE SPLITS
CREATE TABLE expense_splits (
  expense_id    BIGINT UNSIGNED NOT NULL,
  user_id       BIGINT UNSIGNED NOT NULL,
  share_amount  DECIMAL(10,2) NOT NULL,
  is_paid       BOOLEAN DEFAULT FALSE,
  
  PRIMARY KEY (expense_id, user_id),
  CONSTRAINT fk_splits_expense FOREIGN KEY (expense_id) REFERENCES expenses(expense_id) ON DELETE CASCADE,
  CONSTRAINT fk_splits_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 10. MEMORIES
CREATE TABLE memories (
  memory_id    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  trip_id      BIGINT UNSIGNED NOT NULL,
  user_id      BIGINT UNSIGNED NOT NULL,
  type         VARCHAR(10) NOT NULL,
  description  TEXT NULL,
  media_url    LONGTEXT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (memory_id),
  CONSTRAINT fk_memories_trip FOREIGN KEY (trip_id) REFERENCES trips(trip_id) ON DELETE CASCADE,
  CONSTRAINT fk_memories_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 11. TRIP MESSAGES (Chat Grupal)
CREATE TABLE trip_messages (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  trip_id        BIGINT UNSIGNED NOT NULL,
  user_id        BIGINT UNSIGNED NOT NULL,
  content        TEXT NOT NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  CONSTRAINT fk_trip_msg_trip FOREIGN KEY (trip_id) REFERENCES trips(trip_id) ON DELETE CASCADE,
  CONSTRAINT fk_trip_msg_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;


-- =========================================================
-- 4) SEED DATA (DATOS DE PRUEBA REALISTAS)
-- =========================================================

-- --- 1. USUARIOS (Sergi, Miriam, Iker + ADMIN) ---
INSERT INTO users (email, user_name, avatar_url, provider, password_hash, role) VALUES
  ('sergi@gmail.com',  'Sergi',  'https://ui-avatars.com/api/?name=Sergi&background=0D8ABC&color=fff', 'local', '1234', 'user'),  -- ID 1
  ('miriam@gmail.com', 'Miriam', 'https://ui-avatars.com/api/?name=Miriam&background=e91e63&color=fff', 'local', '1234', 'user'),  -- ID 2
  ('iker@gmail.com',   'Iker',   'https://ui-avatars.com/api/?name=Iker&background=4caf50&color=fff', 'local', '1234', 'user'),  -- ID 3
  ('admin@tripshare.com', 'admin', 'https://ui-avatars.com/api/?name=Admin&background=000&color=fff', 'local', '1234', 'admin'); -- ID 4 (EL ADMIN)

-- --- 2. AMISTADES ---
INSERT INTO friend_requests (from_user_id, to_user_id, status) VALUES 
  (1, 2, 'accepted'),
  (2, 3, 'accepted'),
  (3, 1, 'accepted');

-- --- 3. VIAJES ---
-- Nota: Ponemos image_url como NULL para probar tu placeholder del frontend

-- Viajes de SERGI (ID 1)
INSERT INTO trips (name, destination, origin, start_date, end_date, created_by_user_id, image_url) VALUES
  ('Japón Tecnológico', 'Tokio', 'Barcelona', '2026-03-15', '2026-03-30', 1, NULL),
  ('Ruta 66 en Moto', 'Chicago', 'Los Ángeles', '2026-08-01', '2026-08-20', 1, NULL);

-- Viajes de MIRIAM (ID 2)
INSERT INTO trips (name, destination, origin, start_date, end_date, created_by_user_id, image_url) VALUES
  ('Escapada a París', 'París', 'Madrid', '2026-02-14', '2026-02-18', 2, 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop'), -- Esta SÍ tiene foto de prueba
  ('Relax en Bali', 'Bali', 'Singapur', '2026-06-10', '2026-06-25', 2, NULL);

-- Viajes de IKER (ID 3)
INSERT INTO trips (name, destination, origin, start_date, end_date, created_by_user_id, image_url) VALUES
  ('Snowboard Alpes', 'Chamonix', 'Bilbao', '2026-01-10', '2026-01-17', 3, NULL),
  ('Surf Trip Canarias', 'Lanzarote', 'Santander', '2026-09-05', '2026-09-12', 3, NULL);

-- --- 4. MIEMBROS DE VIAJES ---

-- Viaje 1
INSERT INTO trip_members (trip_id, user_id, role, status) VALUES 
  (1, 1, 'owner', 'accepted'), (1, 2, 'member', 'accepted'), (1, 3, 'member', 'pending');

-- Viaje 2
INSERT INTO trip_members (trip_id, user_id, role, status) VALUES 
  (2, 1, 'owner', 'accepted');

-- Viaje 3
INSERT INTO trip_members (trip_id, user_id, role, status) VALUES 
  (3, 2, 'owner', 'accepted'), (3, 1, 'member', 'accepted');

-- Viaje 4
INSERT INTO trip_members (trip_id, user_id, role, status) VALUES 
  (4, 2, 'owner', 'accepted'), (4, 3, 'member', 'accepted');

-- Viaje 5
INSERT INTO trip_members (trip_id, user_id, role, status) VALUES 
  (5, 3, 'owner', 'accepted'), (5, 1, 'member', 'accepted'), (5, 2, 'member', 'accepted');

-- Viaje 6
INSERT INTO trip_members (trip_id, user_id, role, status) VALUES 
  (6, 3, 'owner', 'accepted'), (6, 1, 'member', 'pending');

-- --- 5. ACTIVIDADES ---
INSERT INTO activities (trip_id, created_by_user_id, title, description, location, start_datetime, end_datetime) VALUES
  (1, 1, 'Visita Akihabara', 'Comprar electrónica retro', 'Akihabara Station', '2026-03-16 10:00:00', '2026-03-16 14:00:00'),
  (3, 2, 'Cena Torre Eiffel', 'Reserva a las 21h', 'Tour Eiffel', '2026-02-14 21:00:00', '2026-02-14 23:00:00');

-- --- 6. GASTOS ---
INSERT INTO expenses (trip_id, paid_by_user_id, description, amount) VALUES
  (3, 2, 'Cena Romántica', 120.50),
  (1, 1, 'Tickets Tren Bala', 300.00);

-- --- 7. LUGARES VISITADOS ---
INSERT INTO visited_places (user_id, name, latitude, longitude) VALUES
  (1, 'Sagrada Familia', 41.4036, 2.1744),
  (2, 'Puerta de Alcalá', 40.4199, -3.6887),
  (3, 'Guggenheim Bilbao', 43.2686, -2.9340);