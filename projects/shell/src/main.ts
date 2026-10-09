import { initFederation } from '@angular-architects/native-federation';

// 1. Se lee el manifest y se arma el import map (dónde vive cada remote y cada lib compartida).
// 2. Recién después se importa Angular: por eso el bootstrap va en otro archivo con import().
initFederation('federation.manifest.json', {
  hostRemoteEntry: { url: './remoteEntry.json' },
})
  .then(({ loadRemoteModule }) => import('./bootstrap').then((m) => m.bootstrap(loadRemoteModule)))
  .catch((err) => console.error(err));
