// SQL only. No business rules here.
export function createStudentsRepository(pool) {
  return {
    async findById(studentId) {
      const [rows] = await pool.execute(
        'SELECT student_id, full_name, status FROM students WHERE student_id = ?',
        [studentId],
      );
      if (rows.length === 0) return null;
      const row = rows[0];
      return { studentId: row.student_id, fullName: row.full_name, status: row.status };
    },
  };
}
