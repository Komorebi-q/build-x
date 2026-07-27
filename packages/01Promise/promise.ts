import { runtimeScheduler, type Scheduler } from "./schedule";
import { isFunction } from "./utils";

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
export type FulfillCallback = (value?: any) => any;
export type RejectCallback = (reason?: any) => any;
type Reaction = [onFulfilled?: FulfillCallback, onRejected?: RejectCallback];
export type PromiseLikeType = {
  then: (
    fulfilledCallback?: FulfillCallback,
    rejectedCallback?: RejectCallback
  ) => PromiseLikeType;
  getSnapshot: () => State;
};

export const PromiseLike = (
  executor: PromiseExecutor,
  scheduler: Scheduler = runtimeScheduler
): PromiseLikeType => {
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
  ): PromiseLikeType => {
    const executor: PromiseExecutor = (resolve, reject) => {
      const onFulfilled = (resolvedValue: any, callback?: FulfillCallback) => {
        if (!isFunction(callback)) {
          resolve(value);
          return;
        }

        try {
          resolve(callback(resolvedValue));
        } catch (e) {
          reject(e);
        }
      };
      const onRejected = (rejectedReason: any, callback?: RejectCallback) => {
        if (!isFunction(callback)) {
          reject(reason);
          return;
        }

        try {
          resolve(callback(rejectedReason));
        } catch (e) {
          reject(e);
        }
      };
      switch (status) {
        case "fulfilled": {
          scheduler.enqueue(() => onFulfilled(value, fulfilledCallback));
          break;
        }
        case "rejected": {
          scheduler.enqueue(() => onRejected(reason, rejectedCallback));
          break;
        }
        case "pending":
        default: {
          reactions.push([
            (resolveValue: any) => onFulfilled(resolveValue, fulfilledCallback),
            (rejectedReason: any) =>
              onRejected(rejectedReason, rejectedCallback)
          ]);
        }
      }
    };

    const child = PromiseLike(executor, scheduler);

    return child;
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
