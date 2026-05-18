-- RBAC menu động + vai trò (chạy một lần trên DB asset_management khi ddl-auto=none)

CREATE TABLE IF NOT EXISTS fm_menu_permissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  parent_id BIGINT UNSIGNED DEFAULT NULL,
  title VARCHAR(200) NOT NULL,
  menu_name VARCHAR(120) NOT NULL,
  path VARCHAR(500) DEFAULT NULL,
  permission_type INT NOT NULL DEFAULT 0 COMMENT '-1=NAV, 0=PAGE',
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_fm_menu_parent (parent_id),
  CONSTRAINT fk_fm_menu_parent FOREIGN KEY (parent_id) REFERENCES fm_menu_permissions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS fm_roles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(150) NOT NULL,
  description VARCHAR(500) DEFAULT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_fm_roles_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS fm_role_menu (
  role_id BIGINT UNSIGNED NOT NULL,
  menu_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (role_id, menu_id),
  CONSTRAINT fk_fm_role_menu_role FOREIGN KEY (role_id) REFERENCES fm_roles (id) ON DELETE CASCADE,
  CONSTRAINT fk_fm_role_menu_menu FOREIGN KEY (menu_id) REFERENCES fm_menu_permissions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
