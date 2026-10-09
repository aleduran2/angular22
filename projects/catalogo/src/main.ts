import { initFederation } from '@angular-architects/native-federation';

initFederation({}, { hostRemoteEntry: { url: './remoteEntry.json' } })
  .then(() => import('./bootstrap'))
  .catch((err) => console.error(err));
