import { runtimeScheduler, type Scheduler } from "./schedule";
import { isFunction } from "./utils";

export type ResolveCapability = (value?: any) => void;
export type RejectCapability = (reason?: any) => void;
export type PromiseExecutor = (
  resolve: ResolveCapability,
  reject: RejectCapability
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
type ReactionRunner = (settlementPayload: any) => void;
type Reaction = [runFulfilled: ReactionRunner, runRejected: ReactionRunner];
export type FulfillCallback = (value?: any) => any;
export type RejectCallback = (reason?: any) => any;
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
  let capabilityLocked = false;
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
          resolve(resolvedValue);
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
          reject(rejectedReason);
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
  const finalFulfill = (finalValue: any) => {
    if (status !== "pending") return;
    status = "fulfilled";
    value = finalValue;

    for (const reaction of reactions) {
      const [runFulfilled] = reaction;
      scheduler.enqueue(() => runFulfilled(finalValue));
    }

    clearReactions();
  };
  const finalReject = (finalReason: any) => {
    if (status !== "pending") return;
    status = "rejected";
    reason = finalReason;

    for (const reaction of reactions) {
      const [, runRejected] = reaction;
      scheduler.enqueue(() => runRejected(finalReason));
    }

    clearReactions();
  };
  const innerResolve = (candidate: any) => {
    let called = false;
    const resolveOnce = (value: any) => {
      if (called) return;
      called = true;
      innerResolve(value);
    };
    const rejectOnce = (reason: any) => {
      if (called) return;
      called = true;
      innerReject(reason);
    };

    // `.then` may be an observable getter, so read, validate, and invoke the
    // same saved value once while preserving `candidate` as its `this` value.
    let then: unknown;
    try {
      then =
        candidate !== null && ["object", "function"].includes(typeof candidate)
          ? candidate.then
          : null;
    } catch (error) {
      rejectOnce(error);
      return;
    }

    if (isFunction(then)) {
      then.call(candidate, resolveOnce, rejectOnce);
      return;
    }

    finalFulfill(candidate);
  };
  const innerReject = (reason: any) => {
    finalReject(reason);
  };
  const resolve: ResolveCapability = (resolvedValue?: any) => {
    if (capabilityLocked) return;

    capabilityLocked = true;
    innerResolve(resolvedValue);
  };
  const reject: RejectCapability = (rejectedReason?: any) => {
    if (capabilityLocked) return;

    capabilityLocked = true;
    innerReject(rejectedReason);
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
