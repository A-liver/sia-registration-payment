// SQL only. No business rules here.
function toEnrollmentId(id) {
  return `ENR-${String(id).padStart(6, '0')}`;
}

export function createEnrollmentsRepository(pool) {
  return {
    // Throws an error with code ER_DUP_ENTRY when the same update already exists.
    async insert({ studentId, courseId, paymentReference }) {
      const [result] = await pool.execute(
        'INSERT INTO enrollments (student_id, course_id, payment_reference) VALUES (?, ?, ?)',
        [studentId, courseId, paymentReference],
      );
      return { enrollmentId: toEnrollmentId(result.insertId), status: 'enrolled' };
    },

    async findExisting({ studentId, courseId, paymentReference }) {
      const [rows] = await pool.execute(
        `SELECT id, status FROM enrollments
         WHERE student_id = ? AND course_id = ? AND payment_reference = ?`,
        [studentId, courseId, paymentReference],
      );
      if (rows.length === 0) return null;
      return { enrollmentId: toEnrollmentId(rows[0].id), status: rows[0].status };
    },
  };
}
