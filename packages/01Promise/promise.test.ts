import { describe, it, expect, vi, Mock } from "vitest";
import {
  PromiseLike,
  type PromiseExecutor,
  type FulfillCallback,
  type RejectCallback,
  type PromiseLikeType,
  adapter,
} from "./promise";
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
        status: "pending",
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
        value: 42,
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
        reason: 42,
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

describe("MyPromise scheduling", () => {
  describe("scheduler queue", () => {
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
        }),
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

  describe("deferred handlers", () => {
    it("defers a fulfillment handler registered while pending until the scheduler is flushed after fulfillment", () => {
      const testScheduler = createTestScheduler();
      const scheduler = { enqueue: testScheduler.enqueue };
      let resolveOuter: Parameters<PromiseExecutor>[0] = () => {};
      const executor = vi.fn((resolve) => {
        resolveOuter = resolve;
      });
      const { then } = PromiseLike(executor, scheduler);
      const value = {
        resolved: "resolved",
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
      let rejectOuter: Parameters<PromiseExecutor>[1] = () => {};
      const executor = vi.fn((_, reject) => {
        rejectOuter = reject;
      });
      const { then } = PromiseLike(executor, scheduler);
      const reason = {
        reason: "rejected",
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
      let resolveOuter: Parameters<PromiseExecutor>[0] = () => {};
      const executor = vi.fn((resolve) => {
        resolveOuter = resolve;
      });
      const { then } = PromiseLike(executor, scheduler);
      const value = {
        resolved: "resolved",
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
      let rejectOuter: Parameters<PromiseExecutor>[1] = () => {};
      const executor = vi.fn((_, reject) => {
        rejectOuter = reject;
      });
      const { then } = PromiseLike(executor, scheduler);
      const reason = {
        reason: "reject",
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
      let resolveOuter: Parameters<PromiseExecutor>[0] = () => {};
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
        value: 1,
      };
      const value2 = {
        value: 2,
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

  describe("runtime microtask", () => {
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

    it("runs interleaved native and custom promise reactions in FIFO order", async () => {
      const events: string[] = [];
      const mp = PromiseLike((resolve) => {
        resolve("mp value");
      });
      const np = new Promise((resolve) => {
        resolve("np value");
      });
      mp.then(() => {
        events.push("mine-1");
      });
      np.then(() => {
        events.push("np-1");
      });
      mp.then(() => {
        events.push("mine-2");
      });
      np.then(() => {
        events.push("np-2");
      });
      events.push("sync-end");
      expect(events).toEqual(["sync-end"]);
      await Promise.resolve();
      expect(events).toEqual(["sync-end", "mine-1", "np-1", "mine-2", "np-2"]);
    });

    it("runs pending reactions before timer tasks after synchronous settlement", async () => {
      const events: string[] = [];
      let resolveOuter: Parameters<PromiseExecutor>[0] = () => {};
      const p = PromiseLike((resolve) => {
        resolveOuter = resolve;
      });
      expect(p.getSnapshot().status).toBe("pending");
      p.then(() => {
        events.push("handler");
      });
      resolveOuter();
      setTimeout(() => {
        events.push("timeout");
      }, 0);
      events.push("sync-end");
      expect(events).toEqual(["sync-end"]);
      await Promise.resolve();
      expect(events).toEqual(["sync-end", "handler"]);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(events).toEqual(["sync-end", "handler", "timeout"]);
    });

    it("preserves FIFO order for native and custom reactions around pending settlement", async () => {
      let resolveOuter: Parameters<PromiseExecutor>[0] = () => {};
      const mp = PromiseLike((resolve) => {
        resolveOuter = resolve;
      });
      const np = new Promise((resolve) => {
        resolve("np value");
      });
      const events: string[] = [];
      mp.then(() => {
        events.push("mp");
      });
      np.then(() => {
        events.push("np before");
      });
      resolveOuter();
      np.then(() => {
        events.push("np after");
      });
      setTimeout(() => {
        events.push("timeout");
      });
      events.push("sync-end");
      expect(events).toEqual(["sync-end"]);
      await Promise.resolve();
      expect(events).toEqual(["sync-end", "np before", "mp", "np after"]);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(events).toEqual([
        "sync-end",
        "np before",
        "mp",
        "np after",
        "timeout",
      ]);
    });
  });
});

describe("MyPromise child Promise", () => {
  describe("child identity", () => {
    it("returns a distinct child PromiseLike from then", () => {
      const executor = vi.fn();
      const parent = PromiseLike(executor);
      const child = parent.then();
      expect(child).not.toBe(parent);
      expect(child).toEqual(
        expect.objectContaining({
          then: expect.any(Function),
          getSnapshot: expect.any(Function),
        }),
      );
    });

    it("returns a different child PromiseLike for each then call", () => {
      let resolveOuter = () => {};
      const executor = vi.fn<PromiseExecutor>((resolve) => {
        resolveOuter = resolve;
      });
      const parent = PromiseLike(executor);
      const childA = parent.then();
      const childB = parent.then();
      expect(childA).not.toBe(parent);
      expect(childB).not.toBe(parent);
      expect(childA).not.toBe(childB);
      expect(childA.getSnapshot().status).toBe("pending");
      expect(childB.getSnapshot().status).toBe("pending");
      resolveOuter();
      expect(childA.getSnapshot().status).toBe("pending");
      expect(childB.getSnapshot().status).toBe("pending");
    });
  });

  describe("handler selection", () => {
    it("runs only onFulfilled when a pending parent is fulfilled", () => {
      const testScheduler = createTestScheduler();
      const scheduler = {
        enqueue: testScheduler.enqueue,
      };
      const value = {
        value: "resolved",
      };
      let resolveOuter: Parameters<PromiseExecutor>[0] = () => {};
      const executor = vi.fn<PromiseExecutor>((resolve) => {
        resolveOuter = resolve;
      });
      const onFulfilled = vi.fn();
      const onRejected = vi.fn();
      const parent = PromiseLike(executor, scheduler);
      parent.then(onFulfilled, onRejected);
      expect(onFulfilled).not.toHaveBeenCalled();
      expect(onRejected).not.toHaveBeenCalled();
      resolveOuter(value);
      expect(onFulfilled).not.toHaveBeenCalled();
      expect(onRejected).not.toHaveBeenCalled();
      testScheduler.flushNext();
      expect(onFulfilled).toHaveBeenCalledOnce();
      expect(onRejected).not.toHaveBeenCalled();
      testScheduler.flushNext();
      expect(onFulfilled).toHaveBeenCalledOnce();
      expect(onRejected).not.toHaveBeenCalled();
    });

    it("runs only onRejected when a pending parent is rejected", () => {
      const testScheduler = createTestScheduler();
      const scheduler = {
        enqueue: testScheduler.enqueue,
      };
      const value = {
        value: "resolved",
      };
      let rejectOuter: Parameters<PromiseExecutor>[1] = () => {};
      const executor = vi.fn<PromiseExecutor>((_, reject) => {
        rejectOuter = reject;
      });
      const onFulfilled = vi.fn();
      const onRejected = vi.fn();
      const parent = PromiseLike(executor, scheduler);
      parent.then(onFulfilled, onRejected);
      expect(onFulfilled).not.toHaveBeenCalled();
      expect(onRejected).not.toHaveBeenCalled();
      rejectOuter(value);
      expect(onFulfilled).not.toHaveBeenCalled();
      expect(onRejected).not.toHaveBeenCalled();
      testScheduler.flushNext();
      expect(onRejected).toHaveBeenCalledOnce();
      expect(onFulfilled).not.toHaveBeenCalled();
      testScheduler.flushNext();
      expect(onRejected).toHaveBeenCalledOnce();
      expect(onFulfilled).not.toHaveBeenCalled();
    });
  });

  describe("missing or non-function handlers", () => {
    it("propagates the fulfillment value when onFulfilled is missing after the parent is fulfilled", () => {
      const testScheduler = createTestScheduler();
      const scheduler = {
        enqueue: testScheduler.enqueue,
      };
      const value = {
        value: "resolved",
      };
      const executor = vi.fn<PromiseExecutor>((resolve) => {
        resolve(value);
      });
      const parent = PromiseLike(executor, scheduler);
      const child = parent.then();
      expect(child.getSnapshot().status).toBe("pending");
      testScheduler.flushNext();
      const snapshot = child.getSnapshot();
      if (snapshot.status !== "fulfilled") {
        throw new Error('child status should be "fulfilled"');
      }
      expect(snapshot.status).toBe("fulfilled");
      expect(snapshot.value).toBe(value);
    });

    it("propagates the rejection reason when onRejected is missing after the parent is rejected", () => {
      const testScheduler = createTestScheduler();
      const scheduler = {
        enqueue: testScheduler.enqueue,
      };
      const reason = new Error("promise rejected");
      const executor = vi.fn<PromiseExecutor>((_, reject) => {
        reject(reason);
      });
      const parent = PromiseLike(executor, scheduler);
      const child = parent.then();
      expect(child.getSnapshot().status).toBe("pending");
      testScheduler.flushNext();
      const snapshot = child.getSnapshot();
      if (snapshot.status !== "rejected") {
        throw new Error('child status should be "rejected"');
      }
      expect(snapshot.status).toBe("rejected");
      expect(snapshot.reason).toBe(reason);
    });

    it("treats a non-function onFulfilled as missing and propagates the fulfillment value", () => {
      const testScheduler = createTestScheduler();
      const scheduler = {
        enqueue: testScheduler.enqueue,
      };
      const value = {
        value: "resolved",
      };
      const executor = vi.fn<PromiseExecutor>((resolve) => {
        resolve(value);
      });
      const parent = PromiseLike(executor, scheduler);
      const child = parent.then({} as unknown as FulfillCallback);
      expect(child.getSnapshot().status).toBe("pending");
      testScheduler.flushNext();
      const snapshot = child.getSnapshot();
      if (snapshot.status !== "fulfilled") {
        throw new Error('child status should be "fulfilled"');
      }
      expect(snapshot.status).toBe("fulfilled");
      expect(snapshot.value).toBe(value);
    });

    it("treats a non-function onRejected as missing and propagates the rejection reason", () => {
      const testScheduler = createTestScheduler();
      const scheduler = {
        enqueue: testScheduler.enqueue,
      };
      const reason = new Error("promise rejected");
      const executor = vi.fn<PromiseExecutor>((_, reject) => {
        reject(reason);
      });
      const parent = PromiseLike(executor, scheduler);
      const child = parent.then(undefined, [] as unknown as RejectCallback);
      expect(child.getSnapshot().status).toBe("pending");
      testScheduler.flushNext();
      const snapshot = child.getSnapshot();
      if (snapshot.status !== "rejected") {
        throw new Error('child status should be "rejected"');
      }
      expect(snapshot.status).toBe("rejected");
      expect(snapshot.reason).toBe(reason);
    });

    it("propagates the fulfillment value when onFulfilled was missing while the parent was pending", () => {
      const testScheduler = createTestScheduler();
      const scheduler = {
        enqueue: testScheduler.enqueue,
      };
      const value = {
        value: "resolved",
      };
      let resolveOuter: Parameters<PromiseExecutor>[0] = () => {};
      const executor = vi.fn<PromiseExecutor>((resolve) => {
        resolveOuter = resolve;
      });
      const parent = PromiseLike(executor, scheduler);
      const child = parent.then();
      expect(child.getSnapshot()).toEqual({
        status: "pending",
      });
      resolveOuter(value);
      expect(child.getSnapshot()).toEqual({
        status: "pending",
      });
      testScheduler.flushNext();
      const snapshot = child.getSnapshot();
      if (snapshot.status !== "fulfilled") {
        throw new Error("child status should be 'fulfilled'");
      }
      expect(snapshot.status).toBe("fulfilled");
      expect(snapshot.value).toBe(value);
    });

    it("propagates the rejection reason when onRejected is missing before the parent is rejected", () => {
      const testScheduler = createTestScheduler();
      const scheduler = {
        enqueue: testScheduler.enqueue,
      };
      const reason = new Error("rejected");
      let rejectOuter: Parameters<PromiseExecutor>[1] = () => {};
      const executor = vi.fn<PromiseExecutor>((_, reject) => {
        rejectOuter = reject;
      });
      const parent = PromiseLike(executor, scheduler);
      const child = parent.then();
      expect(child.getSnapshot()).toEqual({
        status: "pending",
      });
      rejectOuter(reason);
      expect(child.getSnapshot()).toEqual({
        status: "pending",
      });
      testScheduler.flushNext();
      const snapshot = child.getSnapshot();
      if (snapshot.status !== "rejected") {
        throw new Error("child status should be 'rejected'");
      }
      expect(snapshot.status).toBe("rejected");
      expect(snapshot.reason).toBe(reason);
    });
  });

  describe("ordinary value propagation", () => {
    it("fulfills the child with the ordinary value returned by onFulfilled", () => {
      const testScheduler = createTestScheduler();
      const scheduler = {
        enqueue: testScheduler.enqueue,
      };
      const value = {
        value: "resolved",
      };
      const childResult = {
        value: "childValue",
      };
      const executor = vi.fn<PromiseExecutor>((resolve) => {
        resolve(value);
      });
      const childHandler = vi.fn<FulfillCallback>(() => childResult);
      const parent = PromiseLike(executor, scheduler);
      const child = parent.then(childHandler);
      expect(child.getSnapshot().status).toBe("pending");
      expect(childHandler).not.toHaveBeenCalled();
      testScheduler.flushNext();
      expect(childHandler).toHaveBeenCalledOnce();
      expect(childHandler.mock.calls[0][0]).toBe(value);
      const snapshot = child.getSnapshot();
      if (snapshot.status !== "fulfilled") {
        throw new Error('child status should be "fulfilled"');
      }
      expect(snapshot.status).toBe("fulfilled");
      expect(snapshot.value).toBe(childResult);
    });

    it("fulfills the child with the ordinary value returned by onRejected", () => {
      const testScheduler = createTestScheduler();
      const scheduler = {
        enqueue: testScheduler.enqueue,
      };
      const reason = new Error("rejected");
      const recoveryResult = {
        value: "childValue",
      };
      const executor = vi.fn<PromiseExecutor>((_, reject) => {
        reject(reason);
      });
      const onRejected = vi.fn<RejectCallback>(() => recoveryResult);
      const parent = PromiseLike(executor, scheduler);
      const child = parent.then(undefined, onRejected);
      expect(child.getSnapshot().status).toBe("pending");
      expect(onRejected).not.toHaveBeenCalled();
      testScheduler.flushNext();
      expect(onRejected).toHaveBeenCalledOnce();
      expect(onRejected.mock.calls[0][0]).toBe(reason);
      const snapshot = child.getSnapshot();
      if (snapshot.status !== "fulfilled") {
        throw new Error('child status should be "fulfilled"');
      }
      expect(snapshot.status).toBe("fulfilled");
      expect(snapshot.value).toBe(recoveryResult);
    });

    it("fulfills the child with the handler result when onFulfilled was registered while pending", () => {
      const testScheduler = createTestScheduler();
      const scheduler = {
        enqueue: testScheduler.enqueue,
      };
      const value = {
        value: "resolved",
      };
      const childResult = {
        value: "childValue",
      };
      let resolveOuter: Parameters<PromiseExecutor>[0] = () => {};
      const executor = vi.fn<PromiseExecutor>((resolve) => {
        resolveOuter = resolve;
      });
      const childHandler = vi.fn<FulfillCallback>(() => childResult);
      const parent = PromiseLike(executor, scheduler);
      const child = parent.then(childHandler);
      expect(child.getSnapshot().status).toBe("pending");
      expect(childHandler).not.toHaveBeenCalled();
      resolveOuter(value);
      expect(child.getSnapshot().status).toBe("pending");
      expect(childHandler).not.toHaveBeenCalled();
      testScheduler.flushNext();
      expect(childHandler).toHaveBeenCalledOnce();
      expect(childHandler.mock.calls[0][0]).toBe(value);
      const snapshot = child.getSnapshot();
      if (snapshot.status !== "fulfilled") {
        throw new Error('child status should be "fulfilled"');
      }
      expect(snapshot.status).toBe("fulfilled");
      expect(snapshot.value).toBe(childResult);
    });

    it("fulfills the child with the handler result when onRejected was registered while pending", () => {
      const testScheduler = createTestScheduler();
      const scheduler = {
        enqueue: testScheduler.enqueue,
      };
      const parentError = new Error("parent error");
      const childResult = {
        value: "childValue",
      };
      let rejectOuter: Parameters<PromiseExecutor>[1] = () => {};
      const executor = vi.fn<PromiseExecutor>((_, reject) => {
        rejectOuter = reject;
      });
      const childHandler = vi.fn<RejectCallback>(() => childResult);
      const parent = PromiseLike(executor, scheduler);
      const child = parent.then(undefined, childHandler);
      expect(child.getSnapshot().status).toBe("pending");
      expect(childHandler).not.toHaveBeenCalled();
      rejectOuter(parentError);
      expect(child.getSnapshot().status).toBe("pending");
      expect(childHandler).not.toHaveBeenCalled();
      testScheduler.flushNext();
      expect(childHandler).toHaveBeenCalledOnce();
      expect(childHandler.mock.calls[0][0]).toBe(parentError);
      const snapshot = child.getSnapshot();
      if (snapshot.status !== "fulfilled") {
        throw new Error('child status should be "fulfilled"');
      }
      expect(snapshot.status).toBe("fulfilled");
      expect(snapshot.value).toBe(childResult);
    });
  });

  describe("handler errors", () => {
    it("rejects the child with the exact error thrown by onFulfilled", () => {
      const testScheduler = createTestScheduler();
      const scheduler = {
        enqueue: testScheduler.enqueue,
      };
      const value = {
        value: "resolved",
      };
      const recoveryError = new Error("child rejected");
      const executor = vi.fn<PromiseExecutor>((resolve) => {
        resolve(value);
      });
      const onFulfilled = vi.fn<FulfillCallback>(() => {
        throw recoveryError;
      });
      const parent = PromiseLike(executor, scheduler);
      const child = parent.then(onFulfilled);
      expect(child.getSnapshot().status).toBe("pending");
      expect(onFulfilled).not.toHaveBeenCalled();
      testScheduler.flushNext();
      expect(onFulfilled).toHaveBeenCalledOnce();
      expect(onFulfilled.mock.calls[0][0]).toBe(value);
      const snapshot = child.getSnapshot();
      if (snapshot.status !== "rejected") {
        throw new Error('child status should be "rejected"');
      }
      expect(snapshot.status).toBe("rejected");
      expect(snapshot.reason).toBe(recoveryError);
    });

    it("rejects the child with the exact error thrown by onRejected", () => {
      const testScheduler = createTestScheduler();
      const scheduler = {
        enqueue: testScheduler.enqueue,
      };
      const reason = new Error("parent error");
      const recoveryError = new Error("child rejected");
      const executor = vi.fn<PromiseExecutor>((_, reject) => {
        reject(reason);
      });
      const onRejected = vi.fn<RejectCallback>(() => {
        throw recoveryError;
      });
      const parent = PromiseLike(executor, scheduler);
      const child = parent.then(undefined, onRejected);
      expect(child.getSnapshot().status).toBe("pending");
      expect(onRejected).not.toHaveBeenCalled();
      testScheduler.flushNext();
      expect(onRejected).toHaveBeenCalledOnce();
      expect(onRejected.mock.calls[0][0]).toBe(reason);
      const snapshot = child.getSnapshot();
      if (snapshot.status !== "rejected") {
        throw new Error('child status should be "rejected"');
      }
      expect(snapshot.status).toBe("rejected");
      expect(snapshot.reason).toBe(recoveryError);
    });
  });

  describe("siblings and chains", () => {
    it("settles sibling children independently from their own handler outcomes", () => {
      const testScheduler = createTestScheduler();
      const scheduler = {
        enqueue: testScheduler.enqueue,
      };
      const value = {
        value: "resolved",
      };
      const childAResult = {
        value: "childValue",
      };
      const childBError = new Error("child error");
      let resolveOuter: Parameters<PromiseExecutor>[0] = () => {};
      const executor = vi.fn<PromiseExecutor>((resolve) => {
        resolveOuter = resolve;
      });
      const childAHandler = vi.fn<FulfillCallback>(() => childAResult);
      const childBHandler = vi.fn<FulfillCallback>(() => {
        throw childBError;
      });
      const parent = PromiseLike(executor, scheduler);
      const childA = parent.then(childAHandler);
      const childB = parent.then(childBHandler);
      expect(childA.getSnapshot().status).toBe("pending");
      expect(childAHandler).not.toHaveBeenCalled();
      expect(childB.getSnapshot().status).toBe("pending");
      expect(childBHandler).not.toHaveBeenCalled();
      resolveOuter(value);
      expect(childA.getSnapshot().status).toBe("pending");
      expect(childAHandler).not.toHaveBeenCalled();
      expect(childB.getSnapshot().status).toBe("pending");
      expect(childBHandler).not.toHaveBeenCalled();
      testScheduler.flushAll();
      expect(childAHandler).toHaveBeenCalledOnce();
      expect(childAHandler.mock.calls[0][0]).toBe(value);
      expect(childBHandler).toHaveBeenCalledOnce();
      expect(childBHandler.mock.calls[0][0]).toBe(value);
      const snapshotA = childA.getSnapshot();
      const snapshotB = childB.getSnapshot();
      if (snapshotA.status !== "fulfilled") {
        throw new Error('child status should be "fulfilled"');
      }
      expect(snapshotA.status).toBe("fulfilled");
      expect(snapshotA.value).toBe(childAResult);
      if (snapshotB.status !== "rejected") {
        throw new Error('child status should be "rejected"');
      }
      expect(snapshotB.status).toBe("rejected");
      expect(snapshotB.reason).toBe(childBError);
    });

    it("settles one chain link per queued reaction when flushed step by step", () => {
      const testScheduler = createTestScheduler();
      const scheduler = {
        enqueue: testScheduler.enqueue,
      };
      const value = {
        value: "resolved",
      };
      let resolveOuter: Parameters<PromiseExecutor>[0] = () => {};
      const executor = vi.fn<PromiseExecutor>((resolve) => {
        resolveOuter = resolve;
      });
      const result1 = {
        value: "result1",
      };
      const result2 = {
        value: "result2",
      };
      const result3 = {
        value: "result3",
      };
      const fn1 = vi.fn<FulfillCallback>(() => result1);
      const fn2 = vi.fn<FulfillCallback>(() => result2);
      const fn3 = vi.fn<FulfillCallback>(() => result3);

      const parent = PromiseLike(executor, scheduler);
      const child1 = parent.then(fn1);
      const child2 = child1.then(fn2);
      const child3 = child2.then(fn3);

      const testChild = (
        child: PromiseLikeType,
        fn: Mock<FulfillCallback>,
        value: any,
        parameter: any,
      ) => {
        const snapshot = child.getSnapshot();
        if (snapshot.status !== "fulfilled") {
          throw new Error(`child status should be "fulfilled"`);
        }
        expect(snapshot.status).toBe("fulfilled");
        expect(snapshot.value).toBe(value);
        expect(fn).toHaveBeenCalledOnce();
        expect(fn.mock.calls[0][0]).toBe(parameter);
      };
      expect(fn1).not.toHaveBeenCalled();
      expect(fn2).not.toHaveBeenCalled();
      expect(fn3).not.toHaveBeenCalled();
      resolveOuter(value);
      expect(fn1).not.toHaveBeenCalled();
      expect(fn2).not.toHaveBeenCalled();
      expect(fn3).not.toHaveBeenCalled();
      testScheduler.flushNext();
      testChild(child1, fn1, result1, value);
      expect(fn2).not.toHaveBeenCalled();
      expect(fn3).not.toHaveBeenCalled();
      testScheduler.flushNext();
      testChild(child1, fn1, result1, value);
      testChild(child2, fn2, result2, result1);
      expect(fn3).not.toHaveBeenCalled();
      testScheduler.flushNext();
      testChild(child1, fn1, result1, value);
      testChild(child2, fn2, result2, result1);
      testChild(child3, fn3, result3, result2);
      testScheduler.flushNext();
      testChild(child1, fn1, result1, value);
      testChild(child2, fn2, result2, result1);
      testChild(child3, fn3, result3, result2);
    });
  });
});

describe("MyPromise thenable resolution", () => {
  describe("adoption", () => {
    it("adopts the fulfilled value of a thenable returned by onFulfilled", () => {
      const testScheduler = createTestScheduler();
      const scheduler = { enqueue: testScheduler.enqueue };
      const value = {
        value: "resolved",
      };
      const executor = vi.fn<PromiseExecutor>((resolve) => {
        resolve();
      });
      const thenable = {
        then(resolve: Parameters<PromiseExecutor>[0]) {
          resolve(value);
        },
      };
      const parent = PromiseLike(executor, scheduler);
      const child = parent.then(() => thenable);
      expect(child.getSnapshot().status).toBe("pending");
      testScheduler.flushNext();
      const snapshot = child.getSnapshot();
      if (snapshot.status !== "fulfilled") {
        throw new Error("child status should be 'fulfilled'");
      }
      expect(snapshot.status).toBe("fulfilled");
      expect(snapshot.value).toBe(value);
    });

    it("adopts the fulfilled value of a thenable passed directly to resolve", () => {
      const testScheduler = createTestScheduler();
      const scheduler = { enqueue: testScheduler.enqueue };
      const value = {
        value: "resolved",
      };
      const thenable = {
        then(resolve: Parameters<PromiseExecutor>[0]) {
          resolve(value);
        },
      };
      const executor = vi.fn<PromiseExecutor>((resolve) => {
        resolve(thenable);
      });
      const parent = PromiseLike(executor, scheduler);
      const snapshot = parent.getSnapshot();
      if (snapshot.status !== "fulfilled") {
        throw new Error("parent status should be 'fulfilled'");
      }
      expect(snapshot.status).toBe("fulfilled");
      expect(snapshot.value).toBe(value);
    });
  });

  describe("then property and candidate classification", () => {
    it("reads a thenable's then property only once", () => {
      const testScheduler = createTestScheduler();
      const scheduler = { enqueue: testScheduler.enqueue };
      const value = {
        value: "resolved",
      };
      let thenReadTimes = 0;
      const thenable = {
        get then() {
          thenReadTimes++;

          return (resolve: Parameters<PromiseExecutor>[0]) => {
            resolve(value);
          };
        },
      };
      const executor = vi.fn<PromiseExecutor>((resolve) => {
        resolve(thenable);
      });
      const parent = PromiseLike(executor, scheduler);
      testScheduler.flushNext();
      const snapshot = parent.getSnapshot();
      if (snapshot.status !== "fulfilled") {
        throw new Error("parent status should be 'fulfilled'");
      }
      expect(snapshot.status).toBe("fulfilled");
      expect(snapshot.value).toBe(value);
      expect(thenReadTimes).toBe(1);
    });

    it("calls a thenable's then method with the thenable as its receiver", () => {
      let that: any = null;
      const value = {
        value: "resolved",
      };
      const thenable = {
        then(resolve: Parameters<PromiseExecutor>[0]) {
          that = this;
          resolve(value);
        },
      };
      const parent = PromiseLike((resolve) => {
        resolve(thenable);
      });
      const snapshot = parent.getSnapshot();
      if (snapshot.status !== "fulfilled") {
        throw new Error("parent status should be 'fulfilled'");
      }
      expect(snapshot.status).toBe("fulfilled");
      expect(snapshot.value).toBe(value);
      expect(that).toBe(thenable);
    });

    it("treats null as an ordinary fulfillment value", () => {
      const executor = vi.fn<PromiseExecutor>((resolve) => {
        resolve(null);
      });
      const parent = PromiseLike(executor);
      const snapshot = parent.getSnapshot();
      if (snapshot.status !== "fulfilled") {
        throw new Error("parent status should be 'fulfilled'");
      }
      expect(snapshot.status).toBe("fulfilled");
      expect(snapshot.value).toBe(null);
    });

    it("fulfills with an object whose then property is not callable", () => {
      let count = 0;
      const value = {
        get then() {
          count++;

          return {
            value: "then property",
          };
        },
      };
      const parent = PromiseLike((resolve) => {
        resolve(value);
      });
      const snapshot = parent.getSnapshot();
      if (snapshot.status !== "fulfilled") {
        throw new Error("parent status should be 'fulfilled'");
      }
      expect(count).toBe(1);
      expect(snapshot.status).toBe("fulfilled");
      expect(snapshot.value).toBe(value);
    });

    it("adopts a function-shaped thenable", () => {
      const fn1 = function () {};
      const value = {
        value: "resolved",
      };
      const spyFn = vi.fn<
        (
          resolve: Parameters<PromiseExecutor>[0],
          reject: Parameters<PromiseExecutor>[1],
        ) => unknown
      >((resolve) => {
        resolve(value);
      });
      Object.assign(fn1, {
        then: spyFn,
      });
      const parent = PromiseLike((resolve) => {
        resolve(fn1);
      });
      const snapshot = parent.getSnapshot();
      if (snapshot.status !== "fulfilled") {
        throw new Error("parent status should be 'fulfilled'");
      }
      expect(spyFn).toHaveBeenCalledOnce();
      expect(snapshot.status).toBe("fulfilled");
      expect(snapshot.value).toBe(value);
    });
  });

  describe("resolution errors", () => {
    it("rejects with the error thrown by a thenable's then getter", () => {
      const reason = new Error("then getter error");
      const thenable = {
        get then() {
          throw reason;
        },
      };
      const executor = vi.fn<PromiseExecutor>((resolve) => {
        resolve(thenable);
      });
      const parent = PromiseLike(executor);
      const snapshot = parent.getSnapshot();
      if (snapshot.status !== "rejected") {
        throw new Error("parent status should be 'rejected'");
      }
      expect(snapshot.status).toBe("rejected");
      expect(snapshot.reason).toBe(reason);
    });

    it("rejects when calling a thenable's then method throws before either callback", () => {
      const reason = new Error("then method error");
      const thenable = {
        get then() {
          return () => {
            throw reason;
          };
        },
      };
      const executor = vi.fn<PromiseExecutor>((resolve) => {
        resolve(thenable);
      });
      const parent = PromiseLike(executor);
      const snapshot = parent.getSnapshot();
      if (snapshot.status !== "rejected") {
        throw new Error("parent status should be 'rejected'");
      }
      expect(snapshot.status).toBe("rejected");
      expect(snapshot.reason).toBe(reason);
    });
  });

  describe("thenable-local once guard", () => {
    it("ignores rejection after a thenable resolves to a pending thenable", () => {
      const laterReason = new Error("latter rejection");
      const value = {
        value: "resolved",
      };
      let resolveInner: Parameters<PromiseExecutor>[0] = () => {};
      const innerThenable = {
        get then() {
          return (resolve: Parameters<PromiseExecutor>[0]) => {
            resolveInner = resolve;
          };
        },
      };
      const outerThenable = {
        get then() {
          return (
            resolve: Parameters<PromiseExecutor>[0],
            reject: Parameters<PromiseExecutor>[1],
          ) => {
            resolve(innerThenable);
            reject(laterReason);
          };
        },
      };
      const executor = vi.fn<PromiseExecutor>((resolve) => {
        resolve(outerThenable);
      });
      const parent = PromiseLike(executor);
      expect(parent.getSnapshot().status).toBe("pending");
      resolveInner(value);
      const snapshot = parent.getSnapshot();
      if (snapshot.status !== "fulfilled") {
        throw new Error("parent status should be 'fulfilled'");
      }
      expect(snapshot.status).toBe("fulfilled");
      expect(snapshot.value).toBe(value);
    });

    it("keeps the fulfillment value when a thenable throws after calling resolve", () => {
      const reason = new Error("then method error");
      const value = {
        value: "resolved",
      };
      let innerResolve: Parameters<PromiseExecutor>[0] = () => {};
      const innerThenable = {
        get then() {
          return (resolve: Parameters<PromiseExecutor>[0]) => {
            innerResolve = resolve;
          };
        },
      };
      const thenable = {
        get then() {
          return (resolve: Parameters<PromiseExecutor>[0]) => {
            resolve(innerThenable);
            throw reason;
          };
        },
      };
      const executor = vi.fn<PromiseExecutor>((resolve) => {
        resolve(thenable);
      });
      const parent = PromiseLike(executor);
      expect(parent.getSnapshot().status).toBe("pending");
      innerResolve(value);
      const snapshot = parent.getSnapshot();
      if (snapshot.status !== "fulfilled") {
        throw new Error("parent status should be 'fulfilled'");
      }
      expect(snapshot.status).toBe("fulfilled");
      expect(snapshot.value).toBe(value);
    });

    it("ignores resolve after a thenable calls reject", () => {
      const reason = new Error("then method error");
      const value = {
        value: "resolved",
      };
      let thenReadTimes = 0;
      const innerThenable = {
        get then() {
          thenReadTimes++;
          return (resolve: Parameters<PromiseExecutor>[0]) => {
            resolve(value);
          };
        },
      };
      const thenable = {
        get then() {
          return (
            resolve: Parameters<PromiseExecutor>[0],
            reject: Parameters<PromiseExecutor>[1],
          ) => {
            reject(reason);
            resolve(innerThenable);
          };
        },
      };
      const executor = vi.fn<PromiseExecutor>((resolve) => {
        resolve(thenable);
      });
      const parent = PromiseLike(executor);
      expect(thenReadTimes).toBe(0);
      const snapshot = parent.getSnapshot();
      if (snapshot.status !== "rejected") {
        throw new Error("parent status should be 'rejected'");
      }
      expect(snapshot.status).toBe("rejected");
      expect(snapshot.reason).toBe(reason);
    });

    it("ignores a second resolve after a thenable resolves to a pending thenable", () => {
      const value = {
        value: "resolved",
      };
      const afterValue = {
        value: "after resolved",
      };
      let firstResolve: Parameters<PromiseExecutor>[0] = () => {};
      let afterReadTimes = 0;
      const firstThenable = {
        then(resolve: Parameters<PromiseExecutor>[0]) {
          firstResolve = resolve;
        },
      };
      const afterThenable = {
        get then() {
          afterReadTimes++;
          return (resolve: Parameters<PromiseExecutor>[0]) => {
            resolve(afterValue);
          };
        },
      };
      const outerThenable = {
        then(resolve: Parameters<PromiseExecutor>[0]) {
          resolve(firstThenable);
          resolve(afterThenable);
        },
      };
      const executor = vi.fn<PromiseExecutor>((resolve) => {
        resolve(outerThenable);
      });
      const parent = PromiseLike(executor);
      expect(parent.getSnapshot().status).toBe("pending");
      expect(afterReadTimes).toBe(0);
      firstResolve(value);
      const snapshot = parent.getSnapshot();
      if (snapshot.status !== "fulfilled") {
        throw new Error("parent status should be 'fulfilled'");
      }
      expect(snapshot.status).toBe("fulfilled");
      expect(snapshot.value).toBe(value);
      expect(afterReadTimes).toBe(0);
    });

    it("keeps the thenable-local once guard independent for each promise that adopts the same thenable", () => {
      const callbacks: [
        Parameters<PromiseExecutor>[0],
        Parameters<PromiseExecutor>[1],
      ][] = [];
      let readCount = 0;
      const thenable = {
        get then() {
          readCount++;
          return (
            resolve: Parameters<PromiseExecutor>[0],
            reject: Parameters<PromiseExecutor>[1],
          ) => {
            callbacks.push([resolve, reject]);
          };
        },
      };
      const executor = (resolve: Parameters<PromiseExecutor>[0]) => {
        resolve(thenable);
      };
      const p1 = PromiseLike(executor);
      const p2 = PromiseLike(executor);
      expect(p1.getSnapshot()).toEqual({
        status: "pending",
      });
      expect(p2.getSnapshot()).toEqual({
        status: "pending",
      });
      expect(readCount).toBe(2);
      const value = Symbol("p1 value");
      const reason = Symbol("p2 reason");
      callbacks[0][0](value);
      callbacks[1][1](reason);
      const snapshot2 = p2.getSnapshot();
      if (snapshot2.status !== "rejected") {
        throw new Error("p2 status should be 'rejected'");
      }
      expect(snapshot2.status).toBe("rejected");
      expect(snapshot2.reason).toBe(reason);
      const snapshot1 = p1.getSnapshot();
      if (snapshot1.status !== "fulfilled") {
        throw new Error("p1 status should be 'fulfilled'");
      }
      expect(snapshot1.status).toBe("fulfilled");
      expect(snapshot1.value).toBe(value);
    });
  });

  describe("pending states", () => {
    it("remains pending when a thenable calls neither callback", () => {
      const thenSpy = vi.fn<
        (
          resolve: Parameters<PromiseExecutor>[0],
          reject: Parameters<PromiseExecutor>[1],
        ) => unknown
      >(() => {
        return "value";
      });
      const thenable = {
        then: thenSpy,
      };
      const parent = PromiseLike((resolve) => {
        resolve(thenable);
      });
      expect(parent.getSnapshot().status).toBe("pending");
      expect(thenSpy).toHaveBeenCalledOnce();
    });
  });

  describe("self-resolution", () => {
    it("rejects the child with a TypeError when a handler returns that child", () => {
      const testScheduler = createTestScheduler();
      const scheduler = { enqueue: testScheduler.enqueue };
      const executor = (resolve: Parameters<PromiseExecutor>[0]) => {
        resolve();
      };
      const parent = PromiseLike(executor, scheduler);
      const child = parent.then(() => child);
      expect(child.getSnapshot().status).toBe("pending");
      testScheduler.flushNext();
      const snapshot = child.getSnapshot();
      if (snapshot.status !== "rejected") {
        throw new Error("child status should be 'rejected'");
      }
      expect(snapshot.status).toBe("rejected");
      expect(snapshot.reason).toBeInstanceOf(TypeError);
    });

    it("rejects the promise with a TypeError when resolved with itself", () => {
      let resolveParent: Parameters<PromiseExecutor>[0] = () => {};
      const executor = (resolve: Parameters<PromiseExecutor>[0]) => {
        resolveParent = resolve;
      };
      const parent = PromiseLike(executor);
      expect(parent.getSnapshot().status).toBe("pending");
      resolveParent(parent);
      const snapshot = parent.getSnapshot();
      if (snapshot.status !== "rejected") {
        throw new Error("parent status should be 'rejected'");
      }
      expect(snapshot.status).toBe("rejected");
      expect(snapshot.reason).toBeInstanceOf(TypeError);
    });
  });

  describe("public capability lock", () => {
    it("ignores the public reject that arrives after resolve locks onto a thenable", () => {
      const reason = new Error("public reject");
      const value = {
        value: "inner resolved",
      };
      let innerResolve: Parameters<PromiseExecutor>[0] = () => {};
      const thenable = {
        then(resolve: Parameters<PromiseExecutor>[0]) {
          innerResolve = resolve;
        },
      };
      let publicReject: Parameters<PromiseExecutor>[1] = () => {};
      const executor = (
        resolve: Parameters<PromiseExecutor>[0],
        reject: Parameters<PromiseExecutor>[1],
      ) => {
        publicReject = reject;
        resolve(thenable);
      };
      const parent = PromiseLike(executor);
      expect(parent.getSnapshot()).toEqual({
        status: "pending",
      });
      publicReject(reason);
      expect(parent.getSnapshot()).toEqual({
        status: "pending",
      });
      innerResolve(value);
      const snapshot = parent.getSnapshot();
      if (snapshot.status !== "fulfilled") {
        throw new Error("parent status should be 'fulfilled'");
      }
      expect(snapshot.status).toBe("fulfilled");
      expect(snapshot.value).toBe(value);
    });

    it("rejects immediately when the public reject happens before a late resolve(thenable)", () => {
      const reason = new Error("public reject");
      let readCount = 0;
      const thenable = {
        get then() {
          readCount++;
          return (resolve: Parameters<PromiseExecutor>[0]) => {
            resolve("then invoked!!!");
          };
        },
      };
      const executor = (
        resolve: Parameters<PromiseExecutor>[0],
        reject: Parameters<PromiseExecutor>[1],
      ) => {
        reject(reason);
        resolve(thenable);
      };
      const parent = PromiseLike(executor);
      const snapshot = parent.getSnapshot();
      if (snapshot.status !== "rejected") {
        throw new Error("parent status should be 'rejected'");
      }
      expect(snapshot.status).toBe("rejected");
      expect(snapshot.reason).toBe(reason);
      expect(readCount).toBe(0);
    });
  });
});

describe("deferred adapter", () => {
  it("exposes a pending promise and external settlement capabilities", async () => {
    const { promise, resolve } = adapter.deferred();
    const { promise: promise2, reject } = adapter.deferred();
    const resolveValue = Symbol("resolve value");
    const rejectValue = Symbol("reject value");
    expect(promise.getSnapshot().status).toBe("pending");
    expect(promise2.getSnapshot().status).toBe("pending");
    const resolveSpy = vi.fn();
    const rejectSpy = vi.fn();
    promise.then(resolveSpy);
    expect(resolveSpy).not.toHaveBeenCalled();
    resolve(resolveValue);
    await Promise.resolve();
    expect(resolveSpy).toHaveBeenCalledOnce();
    const snapshot1 = promise.getSnapshot();
    if (snapshot1.status !== "fulfilled") {
      throw new Error("promise status should be 'fulfilled'");
    }
    expect(snapshot1.status).toBe("fulfilled");
    expect(snapshot1.value).toBe(resolveValue);

    promise2.then(undefined, rejectSpy);
    expect(rejectSpy).not.toHaveBeenCalled();
    reject(rejectValue);
    await Promise.resolve();
    expect(rejectSpy).toHaveBeenCalledOnce();
    const snapshot2 = promise2.getSnapshot();
    if (snapshot2.status !== "rejected") {
      throw new Error("promise2 status should be 'rejected'");
    }
    expect(snapshot2.status).toBe("rejected");
    expect(snapshot2.reason).toBe(rejectValue);
  });

  it("exposes deferred through the A+ adapter contract", () => {
    expect(adapter.deferred).toBeTypeOf("function");
    const { promise, resolve, reject } = adapter.deferred();
    const {
      promise: promise2,
      resolve: resolve2,
      reject: reject2,
    } = adapter.deferred();
    expect(promise).not.toBe(promise2);
    expect(resolve).not.toBe(resolve2);
    expect(reject).not.toBe(reject2);
    expect(promise.getSnapshot().status).toBe("pending");
    expect(promise2.getSnapshot().status).toBe("pending");
    const resolveValue = Symbol("resolve value");
    resolve(resolveValue);
    const snapshot1 = promise.getSnapshot();
    if (snapshot1.status !== "fulfilled") {
      throw new Error("promise status should be 'fulfilled'");
    }
    expect(snapshot1.status).toBe("fulfilled");
    expect(snapshot1.value).toBe(resolveValue);
    expect(promise2.getSnapshot().status).toBe("pending");
  });
});

describe("MyPromise catch", () => {
  it("passes the rejection reason to catch and fulfills its child with the handler result", () => {
    const reason = Symbol("reason");
    const value = Symbol("value");
    const scheduler = createTestScheduler();
    const catchSpy = vi.fn<RejectCallback>((_reason) => {
      expect(_reason).toBe(reason);
      return value;
    });
    const p = PromiseLike((_, reject) => {
      reject(reason);
    }, scheduler);
    const snapshot = p.getSnapshot();
    if (snapshot.status !== "rejected") {
      throw new Error("p status should be 'rejected'");
    }
    expect(snapshot.status).toBe("rejected");
    expect(snapshot.reason).toBe(reason);
    const c = p.catch(catchSpy);
    expect(c).not.toBe(p);
    expect(c.getSnapshot().status).toBe("pending");
    expect(catchSpy).not.toHaveBeenCalled();
    scheduler.flushNext();
    expect(catchSpy).toHaveBeenCalledOnce();
    const snapshot2 = c.getSnapshot();
    if (snapshot2.status !== "fulfilled") {
      throw new Error("c status should be 'fulfilled'");
    }
    expect(snapshot2.status).toBe("fulfilled");
    expect(snapshot2.value).toBe(value);
  });
});
