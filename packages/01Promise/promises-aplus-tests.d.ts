declare module "promises-aplus-tests" {
  function run(adapter: run.Adapter, callback?: run.Callback): void;
  function run(
    adapter: run.Adapter,
    options: run.Options,
    callback?: run.Callback,
  ): void;

  namespace run {
    interface TestPromise {
      then(
        onFulfilled?: (value: unknown) => unknown,
        onRejected?: (reason: unknown) => unknown,
      ): TestPromise;
    }

    interface Deferred {
      promise: TestPromise;
      resolve(value?: unknown): void;
      reject(reason?: unknown): void;
    }

    interface Adapter {
      deferred(): Deferred;
      resolved?(value: unknown): TestPromise;
      rejected?(reason: unknown): TestPromise;
    }

    interface Options {
      timeout?: number;
      slow?: number;
      reporter?: string;
      grep?: string | RegExp;
      bail?: boolean;
    }

    interface RunnerError extends Error {
      failures?: number;
    }

    type Callback = (error: RunnerError | null) => void;

    function mocha(adapter: Adapter): void;
  }

  export = run;
}
