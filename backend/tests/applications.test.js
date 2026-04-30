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

describe("Applications endpoints", () => {
  beforeEach(() => {
    queryMock.mockReset();
    verifyMock.mockReset();
    verifyMock.mockReturnValue({ id: "u-student" });
  });

  it("creates application when profile is complete and internship exists", async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [{ id: "u-student", role: "student", email: "student@x.com", is_active: true }]
      })
      .mockResolvedValueOnce({ rows: [{ id: "s-1", full_name: "Student", profile_completed: true }] })
      .mockResolvedValueOnce({ rows: [{ id: "int-1", company_id: "c-1", title: "Internship" }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: "app-1", status: "pending" }] })
      .mockResolvedValueOnce({ rows: [{ user_id: "u-company" }] })
      .mockResolvedValueOnce({ rows: [{ id: "notif-1" }] })
      .mockResolvedValueOnce({ rows: [{ id: "audit-1" }] });

    const res = await request(app)
      .post("/api/applications")
      .set("Authorization", "Bearer token")
      .send({ internshipId: "a0a5f5ca-1512-4ca5-8fe5-b112e808bc39" });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("pending");
  });
});
