import { Router } from 'express';

export function studentsRouter(studentsService) {
  const router = Router();

  router.get('/:studentId', async (req, res) => {
    res.json(await studentsService.getStudent(req.params.studentId));
  });

  return router;
}
