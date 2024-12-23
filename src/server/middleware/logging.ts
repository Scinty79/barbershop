export function requestLogger(req: Request, res: Response, next: NextFunction) {
  console.log(`${req.method} ${req.path}`);
  console.log('Body:', req.body);
  next();
} 