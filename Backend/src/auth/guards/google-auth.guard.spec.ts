import { ExecutionContext } from '@nestjs/common';
import { GoogleAuthGuard } from './google-auth.guard';

describe('GoogleAuthGuard', () => {
  it('lets OAuth cancellation reach the callback controller gracefully', () => {
    const request = { query: { error: 'access_denied' }, user: undefined };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
    const guard = new GoogleAuthGuard();

    expect(guard.canActivate(context)).toBe(true);
    expect(request.user).toBeNull();
  });
});
