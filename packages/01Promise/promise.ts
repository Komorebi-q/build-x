import { runtimeScheduler, type Scheduler } from "./schedule";

export type PromiseExecutor = (
  resolve: (value?: any) => void,
  reject: (reason?: any) => void
) => void;
export type PendStatus = {
  status: "pending";
};
export type FulfilledStatus = {
  status: "fulfilled";
  value: any;
};
export type RejectedStatus = {
  status: "rejected";
  reason: any;
};

type State = PendStatus | FulfilledStatus | RejectedStatus;
type StatusType = "fulfilled" | "pending" | "rejected";
export type FulfillCallback = (value?: any) => void;
export type RejectCallback = (reason?: any) => void;
type Reaction = [onFulfilled?: FulfillCallback, onRejected?: RejectCallback];

export const PromiseLike = (
  executor: PromiseExecutor,
  scheduler: Scheduler = runtimeScheduler
) => {
  let freezed = false;
  let status: StatusType = "pending";
  let value: any;
  let reason: any;

  let reactions: Reaction[] = [];

  const clearReactions = () => {
    reactions = [];
  };

  const then = (
    fulfilledCallback?: FulfillCallback,
    rejectedCallback?: RejectCallback
  ) => {
    switch (status) {
      case "fulfilled": {
        if (!fulfilledCallback) break;
        scheduler.enqueue(() => fulfilledCallback(value));
        break;
      }
      case "rejected": {
        if (!rejectedCallback) break;
        scheduler.enqueue(() => rejectedCallback(reason));
        break;
      }
      case "pending":
      default: {
        reactions.push([fulfilledCallback, rejectedCallback]);
      }
    }
  };
  const resolve = (resolvedValue?: any) => {
    if (freezed) return;

    status = "fulfilled";
    value = resolvedValue;
    freezed = true;

    for (const reaction of reactions) {
      if (reaction[0]) {
        const [fulfilledCallback] = reaction;
        scheduler.enqueue(() => fulfilledCallback(resolvedValue));
      }
    }

    clearReactions();
  };
  const reject = (rejectedReason?: any) => {
    if (freezed) return;

    status = "rejected";
    reason = rejectedReason;
    freezed = true;

    for (const reaction of reactions) {
      if (reaction[1]) {
        const [, rejectedCallback] = reaction;
        scheduler.enqueue(() => rejectedCallback(rejectedReason));
      }
    }

    clearReactions();
  };
  const getSnapshot = (): State => {
    switch (status) {
      case "fulfilled": {
        return {
          status,
          value
        };
      }
      case "rejected": {
        return {
          status,
          reason
        };
      }
      case "pending":
      default: {
        return {
          status
        };
      }
    }
  };

  try {
    executor(resolve, reject);
  } catch (e) {
    reject(e);
  }

  return {
    getSnapshot,
    then
  };
};
