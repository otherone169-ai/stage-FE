import request from "supertest";
import { describe, expect, it } from "vitest";

const { default: app } = await import("../src/app.js");

describe("API health", () => {
  it("returns ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});
