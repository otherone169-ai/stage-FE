import { useEffect, useState } from "react";
import apiClient from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import PasswordChangeCard from "../components/PasswordChangeCard";

const StudentProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [cvFile, setCvFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingCv, setIsUploadingCv] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await apiClient.get("/students/me");
      setProfile({
        fullName: data.full_name || "",
        phone: data.phone || "",
        education: data.education || "",
        skills: data.skills || "",
        experience: data.experience || "",
        cvUrl: data.cv_url || ""
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      setIsSavingProfile(true);
      await apiClient.put("/students/me", {
        fullName: profile.fullName,
        phone: profile.phone,
        education: profile.education,
        experience: profile.experience,
        cvUrl: profile.cvUrl,
        skills: profile.skills
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
      });
      setMessage("Profile updated.");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const uploadCv = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!cvFile) {
      setError("Please select a CV file to upload.");
      return;
    }

    try {
      setIsUploadingCv(true);
      const formData = new FormData();
      formData.append("cv", cvFile);

      const { data } = await apiClient.post("/students/me/cv", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setMessage(data.message || "CV uploaded successfully.");
      setCvFile(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload CV");
    } finally {
      setIsUploadingCv(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading student profile..." />;

  return (
    <div className="page-grid page-grid-stack">
      <section className="card profile-header-card">
        <div className="profile-header-content">
          <div className="profile-title">
            <h2>My student profile</h2>
            <p className="profile-subtitle">Keep your academic details and CV up to date.</p>
          </div>
        </div>
      </section>

      <div className="profile-content-grid">
        <section className="card profile-form-card">
          <div className="card-header">
            <h3>Academic information</h3>
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
                <label htmlFor="phone" className="form-label">Phone</label>
                <input
                  id="phone"
                  type="tel"
                  value={profile?.phone || ""}
                  onChange={(event) => setProfile({ ...profile, phone: event.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="education" className="form-label">Education</label>
                <textarea
                  id="education"
                  value={profile?.education || ""}
                  onChange={(event) => setProfile({ ...profile, education: event.target.value })}
                  className="form-textarea"
                  rows={3}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="experience" className="form-label">Experience</label>
                <textarea
                  id="experience"
                  value={profile?.experience || ""}
                  onChange={(event) => setProfile({ ...profile, experience: event.target.value })}
                  className="form-textarea"
                  rows={3}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="skills" className="form-label">Skills</label>
                <textarea
                  id="skills"
                  value={profile?.skills || ""}
                  onChange={(event) => setProfile({ ...profile, skills: event.target.value })}
                  className="form-textarea"
                  rows={3}
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

        <section className="card profile-form-card">
          <div className="card-header">
            <h3>CV</h3>
            <p className="card-description">Upload a PDF or Word file.</p>
          </div>

          {profile?.cvUrl && (
            <p className="section-subtitle">
              Current file: <a href={profile.cvUrl} target="_blank" rel="noreferrer">{profile.cvUrl}</a>
            </p>
          )}

          <form onSubmit={uploadCv} className="profile-form">
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="cvFile" className="form-label">CV file</label>
                <input
                  id="cvFile"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(event) => setCvFile(event.target.files?.[0] || null)}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="primary-btn update-btn" disabled={isUploadingCv}>
                {isUploadingCv ? "Uploading..." : "Upload CV"}
              </button>
            </div>
          </form>
        </section>

        <PasswordChangeCard />
      </div>
    </div>
  );
};

export default StudentProfilePage;
