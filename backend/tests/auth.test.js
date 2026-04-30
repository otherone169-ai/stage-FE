import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const queryMock = vi.fn();

vi.mock("../src/config/db.js", () => ({
  query: (...args) => queryMock(...args),
  default: {
    connect: vi.fn(async () => ({
      query: queryMock,
      release: vi.fn()
    }))
  }
}));

const { default: app } = await import("../src/app.js");

describe("Auth endpoints", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("returns 400 when register payload is invalid", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "bad",
      password: "123"
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation error");
  });

  it("returns 401 on invalid login credentials", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).post("/api/auth/login").send({
      email: "student@x.com",
      password: "wrong-pass"
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toContain("Invalid credentials");
  });
});
