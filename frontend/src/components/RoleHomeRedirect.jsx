import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getHomePathForRole } from "../utils/roleHome";

const RoleHomeRedirect = () => {
  const { user } = useAuth();
  return <Navigate to={getHomePathForRole(user?.role)} replace />;
};

export default RoleHomeRedirect;
