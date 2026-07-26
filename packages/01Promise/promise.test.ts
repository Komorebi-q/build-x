import { describe, it, expect, vi } from "vitest";
import { FulfillCallback, PromiseLike, RejectCallback } from "./promise";
import { createTestScheduler } from "./schedule";

describe("MyPromise state machine", () => {
  describe("construction", () => {
    it("calls the executor synchronously exactly once with resolve and reject functions", () => {
      const executor = vi.fn();
      PromiseLike(executor);
      expect(executor).toHaveBeenCalledTimes(1);

      const firstCallArguments = executor.mock.calls[0];
      expect(firstCallArguments[0]).toEqual(expect.any(Function));
      expect(firstCallArguments[1]).toEqual(expect.any(Function));
    });

    it("remains pending when the executor calls neither resolve nor reject", () => {
      const executor = vi.fn();
      const { getSnapshot } = PromiseLike(executor);
      expect(getSnapshot()).toEqual({
        status: "pending"
      });
    });
  });

  describe("state transitions", () => {
    it("becomes fulfilled with the exact value passed to resolve", () => {
      const value = { resolved: 42 };
      const executor = vi.fn((resolve) => resolve(value));
      const { getSnapshot } = PromiseLike(executor);
      const snapshot = getSnapshot();
      if (snapshot.status !== "fulfilled") {
        throw new Error(`Expected status to be 'fulfilled'`);
      }
      expect(snapshot.status).toBe("fulfilled");
      expect(snapshot.value).toBe(value);
    });

    it("becomes rejected with the exact reason passed to reject", () => {
      const reason = new Error("oops");
      const executor = vi.fn((_, reject) => reject(reason));
      const { getSnapshot } = PromiseLike(executor);
      const snapshot = getSnapshot();
      if (snapshot.status !== "rejected") {
        throw new Error(`Expected status to be 'rejected'`);
      }
      expect(snapshot.status).toBe("rejected");
      expect(snapshot.reason).toBe(reason);
    });

    it("ignores a later rejection after being fulfilled and preserves the first result", () => {
      const executor = vi.fn((resolve, reject) => {
        resolve(42);
        reject("after reject");
      });
      const { getSnapshot } = PromiseLike(executor);
      expect(getSnapshot()).toEqual({
        status: "fulfilled",
        value: 42
      });
    });

    it("ignores a later fulfillment after being rejected and preserves the first result", () => {
      const executor = vi.fn((resolve, reject) => {
        reject(42);
        resolve("after resolve");
      });
      const { getSnapshot } = PromiseLike(executor);
      expect(getSnapshot()).toEqual({
        status: "rejected",
        reason: 42
      });
    });
  });

  describe("executor errors", () => {
    it("rejects with the exact error thrown by the executor without throwing from construction", () => {
      const reason = new Error("throw fail");
      const executor = vi.fn(() => {
        throw reason;
      });
      const { getSnapshot } = PromiseLike(executor);
      const snapshot = getSnapshot();
      if (snapshot.status !== "rejected") {
        throw new Error(`Expected status to be 'rejected'`);
      }
      expect(snapshot.status).toBe("rejected");
      expect(snapshot.reason).toBe(reason);
    });

    it("remains fulfilled with the original value when the executor throws after resolving", () => {
      const executor = vi.fn((resolve) => {
        resolve(42);
        throw "after throw";
      });
      const { getSnapshot } = PromiseLike(executor);
      expect(getSnapshot()).toEqual({ status: "fulfilled", value: 42 });
    });
  });
});

describe("MyPromise scheduler", () => {
  describe("scheduling behavior", () => {
    it("does not execute a job when it is enqueued", () => {
      const callback = vi.fn();
      const scheduler = createTestScheduler();
      scheduler.enqueue(callback);
      expect(callback).not.toHaveBeenCalled();
    });

    it("executes the next queued job exactly once when flushNext is called", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const scheduler = createTestScheduler();
      scheduler.enqueue(callback1);
      scheduler.enqueue(callback2);
      scheduler.flushNext();
      expect(callback1).toHaveBeenCalledOnce();
      expect(callback2).not.toHaveBeenCalled();
      scheduler.flushNext();
      expect(callback1).toHaveBeenCalledOnce();
      expect(callback2).toHaveBeenCalledOnce();
    });

    it("executes all queued jobs in FIFO when flushAll is called", () => {
      const events: string[] = [];
      const callbacks = [
        vi.fn(() => {
          events.push("first");
        }),
        vi.fn(() => {
          events.push("second");
        }),
        vi.fn(() => {
          events.push("third");
        })
      ];

      const scheduler = createTestScheduler();
      for (const callback of callbacks) {
        scheduler.enqueue(callback);
      }
      scheduler.flushAll();
      for (const callback of callbacks) {
        expect(callback).toHaveBeenCalledOnce();
      }
      expect(events).toEqual(["first", "second", "third"]);
    });
  });

  it("defers a fulfillment handler registered while pending until the scheduler is flushed after fulfillment", () => {
    const testScheduler = createTestScheduler();
    const scheduler = { enqueue: testScheduler.enqueue };
    let resolveOuter: FulfillCallback = () => {};
    const executor = vi.fn((resolve) => {
      resolveOuter = resolve;
    });
    const { then } = PromiseLike(executor, scheduler);
    const value = {
      resolved: "resolved"
    };
    const onFulfilled = vi.fn();
    then(onFulfilled);
    testScheduler.flushAll();
    expect(onFulfilled).not.toHaveBeenCalled();
    resolveOuter(value);
    expect(onFulfilled).not.toHaveBeenCalled();
    testScheduler.flushAll();
    expect(onFulfilled).toHaveBeenCalledOnce();
    expect(onFulfilled.mock.calls[0][0]).toBe(value);
  });
  it("defers a rejection handler registered while pending until the scheduler is flushed after rejection", () => {
    const testScheduler = createTestScheduler();
    const scheduler = { enqueue: testScheduler.enqueue };
    let rejectOuter: RejectCallback = () => {};
    const executor = vi.fn((_, reject) => {
      rejectOuter = reject;
    });
    const { then } = PromiseLike(executor, scheduler);
    const reason = {
      reason: "rejected"
    };
    const onRejected = vi.fn();
    then(undefined, onRejected);
    testScheduler.flushAll();
    expect(onRejected).not.toHaveBeenCalled();
    rejectOuter(reason);
    expect(onRejected).not.toHaveBeenCalled();
    testScheduler.flushAll();
    expect(onRejected).toHaveBeenCalledOnce();
    expect(onRejected.mock.calls[0][0]).toBe(reason);
  });

  it("defers a fulfillment handler register after fulfillment until the scheduler is flushed", () => {
    const testScheduler = createTestScheduler();
    const scheduler = { enqueue: testScheduler.enqueue };
    let resolveOuter: FulfillCallback = () => {};
    const executor = vi.fn((resolve) => {
      resolveOuter = resolve;
    });
    const { then } = PromiseLike(executor, scheduler);
    const value = {
      resolved: "resolved"
    };
    resolveOuter(value);
    const onFulfilled = vi.fn();
    then(onFulfilled);
    expect(onFulfilled).not.toHaveBeenCalled();
    testScheduler.flushAll();
    expect(onFulfilled).toHaveBeenCalledOnce();
    testScheduler.flushAll();
    expect(onFulfilled).toHaveBeenCalledOnce();
    expect(onFulfilled.mock.calls[0][0]).toBe(value);
  });

  it("defers a rejection handler register after rejection until the scheduler is flushed", () => {
    const testScheduler = createTestScheduler();
    const scheduler = { enqueue: testScheduler.enqueue };
    let rejectOuter: RejectCallback = () => {};
    const executor = vi.fn((_, reject) => {
      rejectOuter = reject;
    });
    const { then } = PromiseLike(executor, scheduler);
    const reason = {
      reason: "reject"
    };
    rejectOuter(reason);
    const onRejected = vi.fn();
    then(undefined, onRejected);
    expect(onRejected).not.toHaveBeenCalled();
    testScheduler.flushAll();
    expect(onRejected).toHaveBeenCalledOnce();
    testScheduler.flushAll();
    expect(onRejected).toHaveBeenCalledOnce();
    expect(onRejected.mock.calls[0][0]).toBe(reason);
  });

  it("run all fulfillment handlers once in registration order after settlement is flushed", () => {
    const testScheduler = createTestScheduler();
    const scheduler = { enqueue: testScheduler.enqueue };
    let resolveOuter: FulfillCallback = () => {};
    const executor = vi.fn((resolve) => {
      resolveOuter = resolve;
    });
    const { then } = PromiseLike(executor, scheduler);
    const events: string[] = [];
    const first = vi.fn<FulfillCallback>(() => {
      events.push("first");
    });
    const second = vi.fn<FulfillCallback>(() => {
      events.push("second");
    });
    const third = vi.fn<FulfillCallback>(() => {
      events.push("third");
    });
    const value1 = {
      value: 1
    };
    const value2 = {
      value: 2
    };
    then(first);
    then(second);
    resolveOuter(value1);
    then(third);
    resolveOuter(value2);
    expect(first).not.toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();
    expect(third).not.toHaveBeenCalled();
    testScheduler.flushAll();
    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
    expect(third).toHaveBeenCalledOnce();
    expect(first.mock.calls[0][0]).toBe(value1);
    expect(second.mock.calls[0][0]).toBe(value1);
    expect(third.mock.calls[0][0]).toBe(value1);
    expect(events).toEqual(["first", "second", "third"]);
    testScheduler.flushAll();
    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
    expect(third).toHaveBeenCalledOnce();
    expect(events).toEqual(["first", "second", "third"]);
  });
});

describe("MyPromise microtask", () => {
  it("runs a fulfillment handler in a microtask when using the default scheduler", async () => {
    const events: string[] = [];
    const executor = vi.fn((resolve) => {
      events.push("executor");
      resolve(1);
    });
    const promise = PromiseLike(executor);
    promise.then(() => {
      events.push("handler");
    });
    events.push("sync");
    expect(events).toEqual(["executor", "sync"]);
    await Promise.resolve();
    expect(events).toEqual(["executor", "sync", "handler"]);
  });
});
