import { useState } from "react";
import apiClient from "../api/client";

const emptyForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: ""
};

const PasswordChangeCard = ({ email }) => {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (form.newPassword !== form.confirmPassword) {
      setError("New password confirmation does not match.");
      return;
    }

    try {
      setIsSaving(true);
      const { data } = await apiClient.post("/auth/password/change", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      });

      setMessage(data.message || "Password updated successfully.");
      setForm(emptyForm);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update password.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="card">
      <h3>Account Security</h3>
      <p className="card-meta">Update your password without leaving your session.</p>
      {email && <p className="card-meta">Signed in as {email}</p>}
      {error && <p className="form-error">{error}</p>}
      {message && <p className="form-success">{message}</p>}
      <form className="stack-form" onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Current password"
          value={form.currentPassword}
          onChange={(event) => setForm((current) => ({ ...current, currentPassword: event.target.value }))}
          required
        />
        <input
          type="password"
          placeholder="New password"
          value={form.newPassword}
          onChange={(event) => setForm((current) => ({ ...current, newPassword: event.target.value }))}
          minLength={8}
          required
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={form.confirmPassword}
          onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
          minLength={8}
          required
        />
        <button type="submit" className="primary-btn" disabled={isSaving}>
          {isSaving ? "Updating..." : "Update Password"}
        </button>
      </form>
    </section>
  );
};

export default PasswordChangeCard;
