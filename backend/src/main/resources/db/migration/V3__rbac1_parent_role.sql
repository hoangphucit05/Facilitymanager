-- RBAC1: phân cấp vai trò — role con kế thừa hợp menu của role cha (cộng dồn lên chuỗi tổ tiên).

ALTER TABLE fm_roles
  ADD COLUMN parent_role_id BIGINT UNSIGNED NULL AFTER sort_order,
  ADD CONSTRAINT fk_fm_roles_parent
    FOREIGN KEY (parent_role_id) REFERENCES fm_roles (id) ON DELETE SET NULL;

CREATE INDEX idx_fm_roles_parent ON fm_roles (parent_role_id);

-- Gợi ý: MANAGER kế thừa STAFF; ADMIN kế thừa MANAGER (chỉ khi các dòng đã tồn tại).
UPDATE fm_roles c
  INNER JOIN fm_roles p ON p.code = 'STAFF' AND c.code = 'MANAGER'
  SET c.parent_role_id = p.id
  WHERE c.parent_role_id IS NULL;

UPDATE fm_roles c
  INNER JOIN fm_roles p ON p.code = 'MANAGER' AND c.code = 'ADMIN'
  SET c.parent_role_id = p.id
  WHERE c.parent_role_id IS NULL;
