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

describe("Internships endpoints", () => {
  beforeEach(() => {
    queryMock.mockReset();
    verifyMock.mockReset();
    verifyMock.mockReturnValue({ id: "u-1" });
  });

  it("returns paginated internships for authenticated user", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ id: "u-1", role: "student", email: "student@x.com", is_active: true }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "i-1",
            title: "Full-stack intern",
            company_name: "Demo Company"
          }
        ]
      })
      .mockResolvedValueOnce({ rows: [{ total: 1 }] });

    const res = await request(app)
      .get("/api/internships")
      .set("Authorization", "Bearer token");

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.data).toHaveLength(1);
  });
});
