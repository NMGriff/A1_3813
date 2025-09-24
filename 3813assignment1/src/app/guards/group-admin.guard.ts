import { CanActivateFn } from '@angular/router';

export const groupAdminGuard: CanActivateFn = (route, state) => {
  return true;
};
