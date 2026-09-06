// src/utils/userHelpers.ts
import { Response } from 'express';
import { IUserToken } from '../core/IUserProvider';

export function getUserFromResponse(res: Response): IUserToken | null {
  if (res.locals && res.locals.user) {
    return res.locals.user as IUserToken;
  }
  return null;
}
