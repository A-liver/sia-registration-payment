-- DEMO DATA ONLY. These are not real students. Safe to run more than once.

INSERT INTO students (student_id, full_name, status) VALUES
  ('DEMO-1001', 'Demo Student One', 'active'),
  ('DEMO-1002', 'Demo Student Two', 'active'),
  ('DEMO-1003', 'Demo Student Three', 'active'),
  ('DEMO-1004', 'Demo Student Four', 'active'),
  ('DEMO-1005', 'Demo Student Five', 'active'),
  ('DEMO-9000', 'Demo Student Inactive', 'inactive')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), status = VALUES(status);
