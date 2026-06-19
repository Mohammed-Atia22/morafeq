export const getRoleHomePath = (role) => {
  if (role === "ADMIN") return "/admin";
  if (role === "HOST") return "/owner";
  if (role === "GUEST") return "/expatriate";
  return "/";
};
