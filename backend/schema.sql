-- ==========================================================
-- IT HELPDESK TICKETING SYSTEM - BAZA DANYCH MYSQL 8.0
-- Architektura relacyjna z indeksami, kluczami obcymi i audytem
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `it_helpdesk_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `it_helpdesk_db`;

-- 1. TABELA UŻYTKOWNIKÓW (ROLES: ADMIN, AGENT, USER)
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(120) NOT NULL,
  `role` ENUM('ADMIN', 'AGENT', 'USER') NOT NULL DEFAULT 'USER',
  `department` VARCHAR(100) NOT NULL DEFAULT 'Dział Ogólny',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. TABELA ZGŁOSZEŃ (TICKETS)
CREATE TABLE IF NOT EXISTS `tickets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ticket_number` VARCHAR(50) NOT NULL UNIQUE,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `category` ENUM('HARDWARE', 'SOFTWARE', 'NETWORK', 'ACCESS', 'SECURITY', 'OTHER') NOT NULL DEFAULT 'OTHER',
  `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
  `status` ENUM('NEW', 'OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'NEW',
  `reporter_id` INT NOT NULL,
  `assigned_agent_id` INT NULL,
  `sla_deadline` DATETIME NOT NULL,
  `resolved_at` DATETIME NULL,
  `closed_at` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`reporter_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`assigned_agent_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_tickets_status` (`status`),
  INDEX `idx_tickets_priority` (`priority`),
  INDEX `idx_tickets_category` (`category`),
  INDEX `idx_tickets_assigned` (`assigned_agent_id`),
  INDEX `idx_tickets_reporter` (`reporter_id`),
  INDEX `idx_tickets_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. TABELA KOMENTARZY I NOTATEK WEWNĘTRZNYCH (COMMENTS & INTERNAL NOTES)
CREATE TABLE IF NOT EXISTS `ticket_comments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ticket_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `message` TEXT NOT NULL,
  `is_internal_note` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_comments_ticket` (`ticket_id`),
  INDEX `idx_comments_internal` (`is_internal_note`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. TABELA HISTORII AUDYTU (AUDIT LOGS)
CREATE TABLE IF NOT EXISTS `ticket_audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ticket_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `action` VARCHAR(60) NOT NULL,
  `old_value` VARCHAR(255) NULL,
  `new_value` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_audit_ticket` (`ticket_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SEED DANYCH POCZĄTKOWYCH (Hasło demo: Password123!)
-- Hash bcrypt: $2b$12$e8s.m4U2D.2V5oT2Y49F1e.6WzUoM9D4fQeE8y5Fm5M7pX9HqFh3G
INSERT INTO `users` (`id`, `email`, `password_hash`, `full_name`, `role`, `department`) VALUES
(1, 'admin@helpdesk.it', '$2a$10$wE0s9p47T3iMsm36uCjSDe8a4u6gYh2Rk6bM4j6n7o8p9q0r1s2tu', 'Tomasz Lewandowski', 'ADMIN', 'IT Infrastructure & Security'),
(2, 'agent@helpdesk.it', '$2a$10$wE0s9p47T3iMsm36uCjSDe8a4u6gYh2Rk6bM4j6n7o8p9q0r1s2tu', 'Anna Wiśniewska', 'AGENT', 'Service Desk L2'),
(3, 'agent.michal@helpdesk.it', '$2a$10$wE0s9p47T3iMsm36uCjSDe8a4u6gYh2Rk6bM4j6n7o8p9q0r1s2tu', 'Michał Zieliński', 'AGENT', 'Service Desk L1'),
(4, 'user@firma.pl', '$2a$10$wE0s9p47T3iMsm36uCjSDe8a4u6gYh2Rk6bM4j6n7o8p9q0r1s2tu', 'Jan Kowalski', 'USER', 'Dział Finansów i Księgowości'),
(5, 'katarzyna.nowak@firma.pl', '$2a$10$wE0s9p47T3iMsm36uCjSDe8a4u6gYh2Rk6bM4j6n7o8p9q0r1s2tu', 'Katarzyna Nowak', 'USER', 'Dział HR & Talent Acquisition');
