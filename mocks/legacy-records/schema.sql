-- Legacy student records mock. Tables only: the database itself is created by db-setup.js.

CREATE TABLE IF NOT EXISTS students (
  student_id VARCHAR(32) NOT NULL PRIMARY KEY,
  full_name  VARCHAR(120) NOT NULL,
  status     ENUM('active', 'inactive') NOT NULL DEFAULT 'active'
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS enrollments (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  student_id        VARCHAR(32) NOT NULL,
  course_id         VARCHAR(32) NOT NULL,
  payment_reference VARCHAR(64) NOT NULL,
  status            VARCHAR(20) NOT NULL DEFAULT 'enrolled',
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- Makes the enrollment update idempotent: the same update can only exist once.
  CONSTRAINT uq_enrollment UNIQUE (student_id, course_id, payment_reference),
  CONSTRAINT fk_enrollment_student FOREIGN KEY (student_id) REFERENCES students (student_id)
) ENGINE = InnoDB;
