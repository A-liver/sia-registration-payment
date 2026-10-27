import { AppError } from '../errors.js';
import { validBody, validId, validReference } from '../validation.js';
import { ERROR_CODE } from '../../../contracts/statuses.js';

export function createEnrollmentsService({ studentsRepository, enrollmentsRepository }) {
  return {
    // Returns { created, enrollment }. created is false when the same update was already applied.
    async enroll(body) {
      const input = validBody(body);
      const update = {
        studentId: validId(input.studentId, 'studentId'),
        courseId: validId(input.courseId, 'courseId'),
        paymentReference: validReference(input.paymentReference, 'paymentReference'),
      };

      const student = await studentsRepository.findById(update.studentId);
      if (!student) {
        throw new AppError(404, ERROR_CODE.NOT_FOUND, 'No student with that ID.');
      }
      if (student.status !== 'active') {
        throw new AppError(422, ERROR_CODE.INVALID_STUDENT, 'This student record is not active.');
      }

      try {
        const enrollment = await enrollmentsRepository.insert(update);
        return { created: true, enrollment };
      } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') throw error;
        // Same update sent again (for example a retry): return the original result.
        const existing = await enrollmentsRepository.findExisting(update);
        return { created: false, enrollment: existing };
      }
    },
  };
}
