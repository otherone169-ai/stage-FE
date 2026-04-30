import { useEffect, useRef, useState } from "react";
import apiClient from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";

const emptyForm = {
  title: "",
  description: "",
  location: "",
  duration: "",
  domain: "",
  requirements: "",
  requiredSkills: ""
};

const mapInternshipToForm = (internship) => ({
  title: internship.title || "",
  description: internship.description || "",
  location: internship.location || "",
  duration: internship.duration || "",
  domain: internship.domain || "",
  requirements: internship.requirements || "",
  requiredSkills: internship.required_skills || ""
});

const parseRequiredSkills = (value) =>
  value
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);

const CompanyInternshipsPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const editorRef = useRef(null);
  const titleInputRef = useRef(null);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await apiClient.get("/internships/my");
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load your internships");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!editingId) return;

    editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    titleInputRef.current?.focus();
  }, [editingId]);

  const resetEditor = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const submitInternship = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      setIsSubmitting(true);
      const payload = {
        ...form,
        requiredSkills: parseRequiredSkills(form.requiredSkills)
      };

      if (editingId) {
        await apiClient.patch(`/internships/${editingId}`, payload);
        setMessage("Internship updated.");
      } else {
        await apiClient.post("/internships", payload);
        setMessage("Internship published.");
      }

      resetEditor();
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save internship");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (row) => {
    setError("");
    setMessage("");
    setEditingId(row.id);
    setForm(mapInternshipToForm(row));
  };

  const toggleInternshipStatus = async (row) => {
    const nextStatus = !row.is_active;
    setError("");
    setMessage("");

    try {
      setStatusUpdatingId(row.id);
      await apiClient.patch(`/internships/${row.id}/status`, { isActive: nextStatus });
      setMessage(nextStatus ? "Internship reopened." : "Internship closed.");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update internship status");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  if (loading) return <LoadingSpinner label="Loading company internships..." />;

  return (
    <div className="page-grid">
      <section ref={editorRef} className="card">
        <h3>{editingId ? "Edit Internship" : "Publish Internship"}</h3>
        <p className="card-meta">
          {editingId
            ? "Review and save the internship details with a full form."
            : "Create a complete internship offer with structured details."}
        </p>
        {editingId && (
          <p className="form-success">
            Editing internship: <strong>{form.title || "Untitled internship"}</strong>
          </p>
        )}
        {error && <p className="form-error">{error}</p>}
        {message && <p className="form-success">{message}</p>}
        <form className="stack-form" onSubmit={submitInternship}>
          <input
            ref={titleInputRef}
            placeholder="Title"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            required
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            required
          />
          <input
            placeholder="Location"
            value={form.location}
            onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
          />
          <input
            placeholder="Duration"
            value={form.duration}
            onChange={(event) => setForm((current) => ({ ...current, duration: event.target.value }))}
          />
          <input
            placeholder="Domain"
            value={form.domain}
            onChange={(event) => setForm((current) => ({ ...current, domain: event.target.value }))}
          />
          <textarea
            placeholder="Requirements"
            value={form.requirements}
            onChange={(event) => setForm((current) => ({ ...current, requirements: event.target.value }))}
          />
          <input
            placeholder="Required skills (comma separated)"
            value={form.requiredSkills}
            onChange={(event) => setForm((current) => ({ ...current, requiredSkills: event.target.value }))}
          />
          <div className="inline-actions">
            <button className="primary-btn" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : editingId ? "Save Changes" : "Publish"}
            </button>
            {editingId && (
              <button className="secondary-btn" type="button" onClick={resetEditor}>
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="card">
        <h3>My Published Internships</h3>
        <p className="card-meta">Manage your offers with inline editing and status updates.</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Domain</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={editingId === row.id ? "table-row-active" : ""}>
                  <td>{row.title}</td>
                  <td>{row.domain || "-"}</td>
                  <td>{row.is_active ? "active" : "closed"}</td>
                  <td>
                    <div className="inline-actions">
                      <button className="secondary-btn small" type="button" onClick={() => startEditing(row)}>
                        Edit
                      </button>
                      <button
                        className="danger-btn small"
                        type="button"
                        onClick={() => toggleInternshipStatus(row)}
                        disabled={statusUpdatingId === row.id}
                      >
                        {statusUpdatingId === row.id
                          ? row.is_active
                            ? "Closing..."
                            : "Reopening..."
                          : row.is_active
                            ? "Close"
                            : "Reopen"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4}>No internships published yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default CompanyInternshipsPage;
