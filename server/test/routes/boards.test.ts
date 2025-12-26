import { test, after } from "node:test";
import * as assert from "node:assert";
import { build } from "../helper";
import { poolConnection } from "../../src/common/db";

test("GET /boards - should return all boards", async (t) => {
  const app = await build(t);

  const res = await app.inject({
    method: "GET",
    url: "/boards",
  });

  assert.strictEqual(res.statusCode, 200);
  const boards = JSON.parse(res.payload);
  assert.ok(Array.isArray(boards), "Response should be an array");
});

test("GET /boards/:boardId - should return board with columns and tasks", async (t) => {
  const app = await build(t);

  // First, get list of boards to find a valid boardId
  const listRes = await app.inject({
    method: "GET",
    url: "/boards",
  });
  const boards = JSON.parse(listRes.payload);

  if (boards.length === 0) {
    // Skip test if no boards exist
    console.log("⚠️ No boards found, skipping test");
    return;
  }

  const boardId = boards[0].id;

  const res = await app.inject({
    method: "GET",
    url: `/boards/${boardId}`,
  });

  assert.strictEqual(res.statusCode, 200);
  const board = JSON.parse(res.payload);

  // Validate board structure
  assert.ok(board.id, "Board should have an id");
  assert.ok(board.name, "Board should have a name");
  assert.ok(Array.isArray(board.columns), "Board should have columns array");

  // Validate columns structure
  if (board.columns.length > 0) {
    const column = board.columns[0];
    assert.ok(column.id, "Column should have an id");
    assert.ok(column.name, "Column should have a name");
    assert.ok(Array.isArray(column.tasks), "Column should have tasks array");
  }
});

test("GET /boards/:boardId - should return 404 for non-existent board", async (t) => {
  const app = await build(t);

  const res = await app.inject({
    method: "GET",
    url: "/boards/non-existent-uuid-here",
  });

  assert.strictEqual(res.statusCode, 404);
  const body = JSON.parse(res.payload);
  assert.ok(body.error, "Response should have an error message");
});

// Close database connection after all tests complete
after(async () => {
  console.log("🛑 Closing Database Connection (Boards)...");
  await poolConnection.end();
});
