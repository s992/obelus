import { Queue } from 'bullmq';

import { connection } from './connection';
import { worker } from './importWorker';

export const importQueue = new Queue('import', { connection });

worker.on('progress', () => {
  // noop to get knip to shut up for a minute
});
