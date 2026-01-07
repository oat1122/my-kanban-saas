// This file contains code that we reuse between our tests.
import Fastify, { FastifyInstance } from "fastify";
import * as test from "node:test";
import { join } from "node:path";
import AutoLoad from "@fastify/autoload";

export type TestContext = {
  after: typeof test.after;
};

// Automatically build and tear down our instance
async function build(t: TestContext): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false, // Disable logging during tests
  });

  // Register plugins
  await app.register(AutoLoad, {
    dir: join(__dirname, "..", "src", "plugins"),
  });

  // Register routes
  await app.register(AutoLoad, {
    dir: join(__dirname, "..", "src", "routes"),
  });

  // Wait for the app to be ready
  await app.ready();

  // Tear down our app after we are done
  t.after(async () => {
    await app.close();
  });

  return app;
}

export { build };
