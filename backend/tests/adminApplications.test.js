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

describe("Admin applications endpoints", () => {
  beforeEach(() => {
    queryMock.mockReset();
    verifyMock.mockReset();
    verifyMock.mockReturnValue({ id: "admin-1" });
  });

  it("returns applications for authenticated admins", async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [{ id: "admin-1", role: "admin", email: "admin@stageflow.com", is_active: true }]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            application_id: "app-1",
            status: "pending",
            full_name: "Student One",
            student_email: "student1@univ.edu",
            internship_title: "Frontend Internship",
            company_name: "Alpha Tech"
          }
        ]
      });

    const res = await request(app)
      .get("/api/admin/applications")
      .set("Authorization", "Bearer token");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].application_id).toBe("app-1");
  });
});
