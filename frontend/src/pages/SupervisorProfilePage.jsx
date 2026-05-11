import { useEffect, useState } from "react";
import apiClient from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import PasswordChangeCard from "../components/PasswordChangeCard";

const SupervisorProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await apiClient.get("/supervisors/profile/me");
      setProfile({
        fullName: data.full_name || "",
        position: data.position || "",
        email: data.email || "",
        companyName: data.company_name || "",
        companyDescription: data.company_description || "",
        companyLocation: data.company_location || "",
        companyWebsite: data.company_website || ""
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load supervisor profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const save = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSavingProfile(true);

    try {
      await apiClient.patch("/supervisors/profile/me", {
        fullName: profile.fullName,
        position: profile.position,
        companyName: profile.companyName,
        companyDescription: profile.companyDescription,
        companyLocation: profile.companyLocation,
        companyWebsite: profile.companyWebsite
      });
      setMessage("Profile updated.");
      await loadProfile();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update supervisor profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading supervisor profile..." />;

  return (
    <div className="page-grid page-grid-stack">
      <section className="card profile-header-card">
        <div className="profile-header-content">
          <div className="profile-title">
            <h2>My supervisor profile</h2>
            <p className="profile-subtitle">Manage your company and supervision details.</p>
          </div>
        </div>
      </section>

      <div className="profile-content-grid">
        <section className="card profile-form-card">
          <div className="card-header">
            <h3>Professional information</h3>
          </div>

          {error && <div className="form-error">{error}</div>}
          {message && <div className="form-success">{message}</div>}

          <form onSubmit={save} className="profile-form">
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="fullName" className="form-label">Full name</label>
                <input
                  id="fullName"
                  type="text"
                  value={profile?.fullName || ""}
                  onChange={(event) => setProfile({ ...profile, fullName: event.target.value })}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="email" className="form-label">Email</label>
                <input id="email" type="email" value={profile?.email || ""} readOnly className="form-input readonly-input" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="companyName" className="form-label">Company name</label>
                <input
                  id="companyName"
                  type="text"
                  value={profile?.companyName || ""}
                  onChange={(event) => setProfile({ ...profile, companyName: event.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="companyDescription" className="form-label">Company description</label>
                <textarea
                  id="companyDescription"
                  value={profile?.companyDescription || ""}
                  onChange={(event) => setProfile({ ...profile, companyDescription: event.target.value })}
                  className="form-textarea"
                  rows={3}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="companyLocation" className="form-label">Company location</label>
                <input
                  id="companyLocation"
                  type="text"
                  value={profile?.companyLocation || ""}
                  onChange={(event) => setProfile({ ...profile, companyLocation: event.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="companyWebsite" className="form-label">Company website</label>
                <input
                  id="companyWebsite"
                  type="url"
                  value={profile?.companyWebsite || ""}
                  onChange={(event) => setProfile({ ...profile, companyWebsite: event.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="position" className="form-label">Position</label>
                <input
                  id="position"
                  type="text"
                  value={profile?.position || ""}
                  onChange={(event) => setProfile({ ...profile, position: event.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="primary-btn update-btn" disabled={isSavingProfile}>
                {isSavingProfile ? "Updating..." : "Update profile"}
              </button>
            </div>
          </form>
        </section>

        <PasswordChangeCard />
      </div>
    </div>
  );
};

export default SupervisorProfilePage;
