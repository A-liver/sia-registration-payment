import { Router } from 'express';

export function enrollmentsRouter(enrollmentsService) {
  const router = Router();

  router.post('/', async (req, res) => {
    const { created, enrollment } = await enrollmentsService.enroll(req.body);
    res.status(created ? 201 : 200).json(enrollment);
  });

  return router;
}
