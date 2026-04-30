import { useEffect, useState } from "react";
import apiClient from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import PasswordChangeCard from "../components/PasswordChangeCard";
import { useAuth } from "../hooks/useAuth";

const StudentProfilePage = () => {
  const { user } = useAuth();
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

  const save = async (e) => {
    e.preventDefault();
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
          .map((s) => s.trim())
          .filter(Boolean)
      });
      setMessage("Profile updated.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const uploadCv = async () => {
    setError("");
    setMessage("");

    if (!cvFile) {
      setError("Please select a CV file first");
      return;
    }

    try {
      setIsUploadingCv(true);
      const formData = new FormData();
      formData.append("cv", cvFile);

      const { data } = await apiClient.post("/students/me/cv", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setProfile((current) => ({
        ...current,
        cvUrl: data.profile?.cv_url || current?.cvUrl || ""
      }));
      setCvFile(null);
      setMessage("CV uploaded.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload CV");
    } finally {
      setIsUploadingCv(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading student profile..." />;

  return (
    <div className="page-grid">
      <section className="card">
        <h3>Student Profile</h3>
        <p className="card-meta">Keep your student profile and CV ready before applying.</p>
        {error && <p className="form-error">{error}</p>}
        {message && <p className="form-success">{message}</p>}
        <form className="stack-form" onSubmit={save}>
          <input
            placeholder="Full name"
            value={profile?.fullName || ""}
            onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
          />
          <input
            placeholder="Phone"
            value={profile?.phone || ""}
            onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
          />
          <textarea
            placeholder="Education"
            value={profile?.education || ""}
            onChange={(e) => setProfile((p) => ({ ...p, education: e.target.value }))}
          />
          <textarea
            placeholder="Experience"
            value={profile?.experience || ""}
            onChange={(e) => setProfile((p) => ({ ...p, experience: e.target.value }))}
          />
          <input
            placeholder="Skills (comma separated)"
            value={profile?.skills || ""}
            onChange={(e) => setProfile((p) => ({ ...p, skills: e.target.value }))}
          />
          <input
            placeholder="CV URL"
            value={profile?.cvUrl || ""}
            onChange={(e) => setProfile((p) => ({ ...p, cvUrl: e.target.value }))}
          />
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setCvFile(e.target.files?.[0] || null)}
          />
          <button className="secondary-btn" type="button" onClick={uploadCv} disabled={isUploadingCv}>
            {isUploadingCv ? "Uploading..." : "Upload CV"}
          </button>
          <button className="primary-btn" type="submit" disabled={isSavingProfile}>
            {isSavingProfile ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </section>

      <PasswordChangeCard email={user?.email} />
    </div>
  );
};

export default StudentProfilePage;
