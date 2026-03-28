import { Request, Response, NextFunction } from 'express';

type AsyncFunction = (req: Request, res: Response, next: NextFunction) => Promise<any>;

/**
 * Wraps an async express route handler and passes any errors to the `next` function.
 * This eliminates the need for `try { ... } catch (err) { next(err) }` blocks in all controllers.
 */
export const asyncHandler = (fn: AsyncFunction) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
