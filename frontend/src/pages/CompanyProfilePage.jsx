import { useEffect, useState } from "react";
import apiClient from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import PasswordChangeCard from "../components/PasswordChangeCard";
import { useAuth } from "../hooks/useAuth";

const CompanyProfilePage = () => {
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
        const { data } = await apiClient.get("/companies/me");
        setProfile({
          name: data.name || "",
          description: data.description || "",
          location: data.location || "",
          website: data.website || ""
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load company profile");
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
      await apiClient.put("/companies/me", profile);
      setMessage("Company profile updated");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update company profile");
    }
  };

  if (loading) return <LoadingSpinner label="Loading company profile..." />;

  return (
    <div className="page-grid">
      <section className="card">
        <h3>Company Profile</h3>
        <p className="card-meta">Update the public company details visible across the platform.</p>
        {error && <p className="form-error">{error}</p>}
        {message && <p className="form-success">{message}</p>}
        <form className="stack-form" onSubmit={save}>
          <label>Name</label>
          <input
            value={profile?.name || ""}
            onChange={(e) => setProfile((current) => ({ ...current, name: e.target.value }))}
            required
          />
          <label>Description</label>
          <textarea
            value={profile?.description || ""}
            onChange={(e) => setProfile((current) => ({ ...current, description: e.target.value }))}
          />
          <label>Location</label>
          <input
            value={profile?.location || ""}
            onChange={(e) => setProfile((current) => ({ ...current, location: e.target.value }))}
          />
          <label>Website</label>
          <input
            value={profile?.website || ""}
            onChange={(e) => setProfile((current) => ({ ...current, website: e.target.value }))}
          />
          <button type="submit" className="primary-btn">
            Save Company
          </button>
        </form>
      </section>

      <PasswordChangeCard email={user?.email} />
    </div>
  );
};

export default CompanyProfilePage;
