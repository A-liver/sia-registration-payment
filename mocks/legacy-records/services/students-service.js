import { AppError } from '../errors.js';
import { validId } from '../validation.js';
import { ERROR_CODE } from '../../../contracts/statuses.js';

export function createStudentsService({ studentsRepository }) {
  return {
    async getStudent(studentId) {
      validId(studentId, 'studentId');
      const student = await studentsRepository.findById(studentId);
      if (!student) {
        throw new AppError(404, ERROR_CODE.NOT_FOUND, 'No student with that ID.');
      }
      return student;
    },
  };
}
