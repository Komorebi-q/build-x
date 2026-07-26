export type Job = () => void;
export type EnqueueJob = (job: Job) => void;
export type Scheduler = {
  enqueue: EnqueueJob;
};
export type TestScheduler = Scheduler & {
  flushNext: () => void;
  flushAll: () => void;
};

export const createTestScheduler = () => {
  const queue: Job[] = [];

  const enqueue = (job: Job): void => {
    queue.push(job);
  };
  const flushNext = () => {
    const job = queue.shift();
    if (!job) return;
    job();
  };
  const flushAll = () => {
    while (queue.length > 0) {
      flushNext();
    }
  };

  return {
    enqueue,
    flushNext,
    flushAll
  };
};

export const runtimeScheduler: Scheduler = {
  enqueue: queueMicrotask
};
