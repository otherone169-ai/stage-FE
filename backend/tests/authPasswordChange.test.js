import bcrypt from "bcryptjs";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const queryMock = vi.fn();
const verifyMock = vi.fn();

vi.mock("jsonwebtoken", async (orig) => {
  const actual = await orig();
  return {
    ...actual,
    default: {
      ...actual.default,
      verify: (...args) => verifyMock(...args)
    }
  };
});

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

describe("Authenticated password change", () => {
  beforeEach(() => {
    queryMock.mockReset();
    verifyMock.mockReset();
    verifyMock.mockReturnValue({ id: "u-1" });
  });

  it("returns 400 when the current password is incorrect", async () => {
    const passwordHash = await bcrypt.hash("CurrentPassword123", 1);

    queryMock
      .mockResolvedValueOnce({
        rows: [{ id: "u-1", role: "student", email: "student@x.com", is_active: true }]
      })
      .mockResolvedValueOnce({
        rows: [{ id: "u-1", password_hash: passwordHash }]
      });

    const res = await request(app)
      .post("/api/auth/password/change")
      .set("Authorization", "Bearer token")
      .send({
        currentPassword: "WrongPassword123",
        newPassword: "NextPassword123"
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Current password is incorrect");
  });

  it("updates the password for an authenticated user", async () => {
    const passwordHash = await bcrypt.hash("CurrentPassword123", 1);

    queryMock
      .mockResolvedValueOnce({
        rows: [{ id: "u-1", role: "student", email: "student@x.com", is_active: true }]
      })
      .mockResolvedValueOnce({
        rows: [{ id: "u-1", password_hash: passwordHash }]
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post("/api/auth/password/change")
      .set("Authorization", "Bearer token")
      .send({
        currentPassword: "CurrentPassword123",
        newPassword: "NextPassword123"
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Password updated successfully");
    expect(queryMock).toHaveBeenCalledWith("UPDATE users SET password_hash = $1 WHERE id = $2", [
      expect.any(String),
      "u-1"
    ]);
  });
});
