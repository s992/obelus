import { Queue } from 'bullmq';

import { worker } from './importWorker';

export const importQueue = new Queue('import');

worker.on('progress', () => {
  // noop to get knip to shut up for a minute
});
