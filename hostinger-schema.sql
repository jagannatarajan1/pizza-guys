-- ============================================================
-- Pizza Guys — MySQL Schema for Hostinger
-- ============================================================
-- How to run:
--   Hostinger hPanel → Databases → phpMyAdmin
--   Select your database → SQL tab → paste & Run
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ── users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `users` (
  `id`            CHAR(36)     NOT NULL,
  `name`          VARCHAR(255) NOT NULL DEFAULT '',
  `email`         VARCHAR(255) NOT NULL,
  `phone`         VARCHAR(30)  NOT NULL DEFAULT '',
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── addresses ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `addresses` (
  `id`         CHAR(36)     NOT NULL,
  `user_id`    CHAR(36)     NOT NULL,
  `label`      VARCHAR(100) NOT NULL DEFAULT 'Home',
  `line1`      VARCHAR(255) NOT NULL DEFAULT '',
  `line2`      VARCHAR(255) NOT NULL DEFAULT '',
  `city`       VARCHAR(100) NOT NULL DEFAULT '',
  `postcode`   VARCHAR(20)  NOT NULL DEFAULT '',
  `notes`      TEXT,
  `is_default` TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_addresses_user` (`user_id`),
  CONSTRAINT `fk_addresses_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── orders ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `orders` (
  `id`                 CHAR(36)     NOT NULL,
  `order_number`       VARCHAR(20)  NOT NULL,
  `user_id`            CHAR(36)     DEFAULT NULL,
  `status`             VARCHAR(30)  NOT NULL DEFAULT 'pending'
                         COMMENT 'pending | confirmed | preparing | out_for_delivery | ready_for_collection | delivered | cancelled | payment_failed',
  `order_type`         VARCHAR(20)  NOT NULL COMMENT 'delivery | collection',
  `customer_name`      VARCHAR(255) NOT NULL,
  `customer_email`     VARCHAR(255) NOT NULL,
  `customer_phone`     VARCHAR(30)  NOT NULL,
  `delivery_address`   JSON         DEFAULT NULL,
  `subtotal`           INT          NOT NULL COMMENT 'pence',
  `delivery_fee`       INT          NOT NULL DEFAULT 0 COMMENT 'pence',
  `discount`           INT          NOT NULL DEFAULT 0 COMMENT 'pence',
  `total`              INT          NOT NULL COMMENT 'pence',
  `payment_intent_id`  VARCHAR(100) DEFAULT NULL,
  `payment_method`     VARCHAR(20)  NOT NULL DEFAULT 'card',
  `scheduled_time`     DATETIME     DEFAULT NULL,
  `created_at`         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_order_number` (`order_number`),
  KEY `idx_orders_user` (`user_id`),
  KEY `idx_orders_status` (`status`),
  CONSTRAINT `fk_orders_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── order_items ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `order_items` (
  `id`                   CHAR(36)     NOT NULL,
  `order_id`             CHAR(36)     NOT NULL,
  `product_id`           VARCHAR(100) NOT NULL,
  `product_name`         VARCHAR(255) NOT NULL,
  `quantity`             INT          NOT NULL,
  `unit_price`           INT          NOT NULL COMMENT 'pence',
  `modifiers`            JSON         NOT NULL,
  `special_instructions` TEXT,
  `item_total`           INT          NOT NULL COMMENT 'pence',
  PRIMARY KEY (`id`),
  KEY `idx_items_order` (`order_id`),
  CONSTRAINT `fk_items_order`
    FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
