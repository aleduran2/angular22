import { TestBed } from '@angular/core/testing';
import { Routes } from '@angular/router';
import { RemoteErrorPage } from '../pages/remote-error.page';
import { REMOTE_LOADER, RemoteLoader, remoteRoutes } from './remote-loader';

function loadWith(loader: RemoteLoader): Promise<Routes> {
  TestBed.configureTestingModule({ providers: [{ provide: REMOTE_LOADER, useValue: loader }] });
  return TestBed.runInInjectionContext(remoteRoutes('catalogo'));
}

describe('remoteRoutes', () => {
  it('returns the routes exposed by the remote', async () => {
    const exposed: Routes = [{ path: '', redirectTo: 'x' }];
    const calls: string[][] = [];
    const loader = ((name: string, module: string) => {
      calls.push([name, module]);
      return Promise.resolve({ routes: exposed });
    }) as RemoteLoader;

    await expect(loadWith(loader)).resolves.toBe(exposed);
    expect(calls).toEqual([['catalogo', './routes']]);
  });

  it('falls back to an error page when the remote is down', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const loader = (() => Promise.reject(new Error('offline'))) as RemoteLoader;

    const routes = await loadWith(loader);

    expect(routes).toEqual([
      { path: '**', component: RemoteErrorPage, data: { remoteName: 'catalogo' } },
    ]);
    expect(consoleError).toHaveBeenCalled();
  });
});
