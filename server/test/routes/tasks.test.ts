import { test, after } from "node:test";
import * as assert from "node:assert";
import { build } from "../helper";
import { poolConnection } from "../../src/db";

// Helper to get a valid columnId from the database
async function getValidColumnId(app: any): Promise<string | null> {
  const boardsRes = await app.inject({
    method: "GET",
    url: "/boards",
  });
  const boards = JSON.parse(boardsRes.payload);

  if (boards.length === 0) return null;

  const boardRes = await app.inject({
    method: "GET",
    url: `/boards/${boards[0].id}`,
  });
  const board = JSON.parse(boardRes.payload);

  if (board.columns && board.columns.length > 0) {
    return board.columns[0].id;
  }
  return null;
}

// Helper to get a valid taskId
async function getValidTaskId(app: any): Promise<string | null> {
  const boardsRes = await app.inject({
    method: "GET",
    url: "/boards",
  });
  const boards = JSON.parse(boardsRes.payload);

  if (boards.length === 0) return null;

  const boardRes = await app.inject({
    method: "GET",
    url: `/boards/${boards[0].id}`,
  });
  const board = JSON.parse(boardRes.payload);

  for (const column of board.columns || []) {
    if (column.tasks && column.tasks.length > 0) {
      return column.tasks[0].id;
    }
  }
  return null;
}

test("POST /tasks - should create a new task", async (t) => {
  const app = await build(t);

  const columnId = await getValidColumnId(app);
  if (!columnId) {
    console.log("⚠️ No columns found, skipping test");
    return;
  }

  const res = await app.inject({
    method: "POST",
    url: "/tasks",
    payload: {
      title: "Test Task from Unit Test",
      columnId: columnId,
      description: "This is a test task",
    },
  });

  assert.strictEqual(res.statusCode, 201);
  const task = JSON.parse(res.payload);

  assert.ok(task.id, "Task should have an id");
  assert.strictEqual(task.title, "Test Task from Unit Test");
  assert.strictEqual(task.columnId, columnId);
  assert.ok(task.position, "Task should have a position");
});

test("POST /tasks - should return 400 for invalid columnId", async (t) => {
  const app = await build(t);

  const res = await app.inject({
    method: "POST",
    url: "/tasks",
    payload: {
      title: "Test Task",
      columnId: "invalid-column-id",
    },
  });

  assert.strictEqual(res.statusCode, 400);
  const body = JSON.parse(res.payload);
  assert.ok(body.error, "Response should have an error message");
});

test("PUT /tasks/:taskId/move - should move task to new position", async (t) => {
  const app = await build(t);

  const taskId = await getValidTaskId(app);
  const columnId = await getValidColumnId(app);

  if (!taskId || !columnId) {
    console.log("⚠️ No tasks or columns found, skipping test");
    return;
  }

  const res = await app.inject({
    method: "PUT",
    url: `/tasks/${taskId}/move`,
    payload: {
      columnId: columnId,
      position: 1,
    },
  });

  assert.strictEqual(res.statusCode, 200);
  const body = JSON.parse(res.payload);
  assert.ok(body.success, "Response should indicate success");
});

test("PUT /tasks/:taskId/move - should return 404 for non-existent task", async (t) => {
  const app = await build(t);

  const columnId = await getValidColumnId(app);
  if (!columnId) {
    console.log("⚠️ No columns found, skipping test");
    return;
  }

  const res = await app.inject({
    method: "PUT",
    url: "/tasks/non-existent-task-id/move",
    payload: {
      columnId: columnId,
      position: 1,
    },
  });

  assert.strictEqual(res.statusCode, 404);
});

test("PATCH /tasks/:taskId - should update task title", async (t) => {
  const app = await build(t);

  const taskId = await getValidTaskId(app);
  if (!taskId) {
    console.log("⚠️ No tasks found, skipping test");
    return;
  }

  const res = await app.inject({
    method: "PATCH",
    url: `/tasks/${taskId}`,
    payload: {
      title: "Updated Task Title",
    },
  });

  assert.strictEqual(res.statusCode, 200);
  const task = JSON.parse(res.payload);
  assert.strictEqual(task.title, "Updated Task Title");
});

test("PATCH /tasks/:taskId - should toggle task completion", async (t) => {
  const app = await build(t);

  const taskId = await getValidTaskId(app);
  if (!taskId) {
    console.log("⚠️ No tasks found, skipping test");
    return;
  }

  const res = await app.inject({
    method: "PATCH",
    url: `/tasks/${taskId}`,
    payload: {
      isCompleted: true,
    },
  });

  assert.strictEqual(res.statusCode, 200);
  const task = JSON.parse(res.payload);
  assert.ok(task.isCompleted, "Task should be marked as completed"); // MySQL returns 1 or true
});

test("DELETE /tasks/:taskId - should delete a task", async (t) => {
  const app = await build(t);

  // First create a task to delete
  const columnId = await getValidColumnId(app);
  if (!columnId) {
    console.log("⚠️ No columns found, skipping test");
    return;
  }

  const createRes = await app.inject({
    method: "POST",
    url: "/tasks",
    payload: {
      title: "Task to Delete",
      columnId: columnId,
    },
  });

  const createdTask = JSON.parse(createRes.payload);

  // Now delete it
  const deleteRes = await app.inject({
    method: "DELETE",
    url: `/tasks/${createdTask.id}`,
  });

  assert.strictEqual(deleteRes.statusCode, 200);
  const body = JSON.parse(deleteRes.payload);
  assert.ok(body.success, "Response should indicate success");

  // Verify task is deleted
  const boardsRes = await app.inject({
    method: "GET",
    url: "/boards",
  });
  const boards = JSON.parse(boardsRes.payload);

  if (boards.length > 0) {
    const boardRes = await app.inject({
      method: "GET",
      url: `/boards/${boards[0].id}`,
    });
    const board = JSON.parse(boardRes.payload);

    // Check that deleted task is not in any column
    for (const column of board.columns || []) {
      const foundTask = column.tasks.find((t: any) => t.id === createdTask.id);
      assert.ok(!foundTask, "Deleted task should not exist");
    }
  }
});

test("DELETE /tasks/:taskId - should return 404 for non-existent task", async (t) => {
  const app = await build(t);

  const res = await app.inject({
    method: "DELETE",
    url: "/tasks/non-existent-task-id",
  });

  assert.strictEqual(res.statusCode, 404);
});

// Close database connection after all tests complete
after(async () => {
  console.log("🛑 Closing Database Connection (Tasks)...");
  await poolConnection.end();
});
