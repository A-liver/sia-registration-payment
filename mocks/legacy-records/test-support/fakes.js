// In-memory stand-ins for the two repositories, so tests run without MySQL.
export function createFakeStudentsRepository() {
  const students = new Map([
    ['DEMO-1001', { studentId: 'DEMO-1001', fullName: 'Demo Student One', status: 'active' }],
    [
      'DEMO-9000',
      { studentId: 'DEMO-9000', fullName: 'Demo Student Inactive', status: 'inactive' },
    ],
  ]);
  return {
    async findById(studentId) {
      return students.get(studentId) ?? null;
    },
  };
}

export function createFakeEnrollmentsRepository() {
  const rows = [];
  const keyOf = ({ studentId, courseId, paymentReference }) =>
    `${studentId}|${courseId}|${paymentReference}`;

  return {
    rows,
    async insert(update) {
      if (rows.some((row) => keyOf(row) === keyOf(update))) {
        const error = new Error('Duplicate entry');
        error.code = 'ER_DUP_ENTRY';
        throw error;
      }
      const id = rows.length + 1;
      rows.push({ ...update, id });
      return { enrollmentId: `ENR-${String(id).padStart(6, '0')}`, status: 'enrolled' };
    },
    async findExisting(update) {
      const row = rows.find((item) => keyOf(item) === keyOf(update));
      if (!row) return null;
      return { enrollmentId: `ENR-${String(row.id).padStart(6, '0')}`, status: 'enrolled' };
    },
  };
}
