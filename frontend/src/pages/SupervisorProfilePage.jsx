import { useEffect, useState } from "react";
import apiClient from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import PasswordChangeCard from "../components/PasswordChangeCard";
import { useAuth } from "../hooks/useAuth";

const SupervisorProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await apiClient.get("/supervisors/profile/me");
        setProfile({
          fullName: data.full_name || "",
          position: data.position || "",
          email: data.email || "",
          companyName: data.company_name || ""
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load supervisor profile");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const save = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await apiClient.patch("/supervisors/profile/me", {
        fullName: profile.fullName,
        position: profile.position
      });
      setMessage("Profile updated");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update supervisor profile");
    }
  };

  if (loading) return <LoadingSpinner label="Loading supervisor profile..." />;

  return (
    <div className="page-grid">
      <section className="card">
        <h3>My Supervisor Profile</h3>
        <p className="card-meta">Keep your contact details and role information up to date.</p>
        {error && <p className="form-error">{error}</p>}
        {message && <p className="form-success">{message}</p>}
        <form className="stack-form" onSubmit={save}>
          <label>Email</label>
          <input value={profile?.email || ""} disabled />
          <label>Company</label>
          <input value={profile?.companyName || ""} disabled />
          <label>Full name</label>
          <input
            value={profile?.fullName || ""}
            onChange={(e) => setProfile((current) => ({ ...current, fullName: e.target.value }))}
            required
          />
          <label>Position</label>
          <input
            value={profile?.position || ""}
            onChange={(e) => setProfile((current) => ({ ...current, position: e.target.value }))}
          />
          <button type="submit" className="primary-btn">
            Save Profile
          </button>
        </form>
      </section>

      <PasswordChangeCard email={user?.email || profile?.email} />
    </div>
  );
};

export default SupervisorProfilePage;
