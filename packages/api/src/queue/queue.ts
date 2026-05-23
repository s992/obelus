import { Queue } from 'bullmq';

import { logger } from '../log';
import { connection } from './connection';
import { getWorker } from './importWorker';

export const importQueue = new Queue('import', { connection });

getWorker().on('error', (err) => {
  logger.error(err, 'import job error');
});

getWorker().on('failed', (job, err) => {
  logger.error(err, `import job failed on job id ${job?.id}`);
});
