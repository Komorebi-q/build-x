import { it } from "vitest";
import { adapter } from "./promise";
import APlus from "promises-aplus-tests";

it(
  "runs the Promises/A+ conformance suite against the adapter",
  {
    timeout: 30_000,
  },
  async () => {
    await new Promise((resolve, reject) => {
      APlus(adapter, { reporter: "dot", timeout: 1_000 }, (error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(undefined);
      });
    });
  },
);
