export const getHomePathForRole = (role) => {
  if (role === "admin") return "/app/dashboard";
  if (role === "student" || role === "supervisor") return "/app/enhanced-dashboard";
  return "/app/dashboard";
};
