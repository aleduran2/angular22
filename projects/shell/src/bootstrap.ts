import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';
import { REMOTE_LOADER, RemoteLoader } from './app/federation/remote-loader';

export function bootstrap(loadRemoteModule: RemoteLoader): Promise<unknown> {
  return bootstrapApplication(App, {
    ...appConfig,
    providers: [...appConfig.providers, { provide: REMOTE_LOADER, useValue: loadRemoteModule }],
  });
}
