import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../hooks/useAuth";

const MAX_CV_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_CV_EXTENSIONS = new Set(["pdf", "doc", "docx"]);

const buildInitial = () => ({
  fullName: "",
  email: "",
  startDate: "",
  endDate: "",
  cv: null
});

const getFileExtension = (filename = "") => {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.at(-1).toLowerCase() : "";
};

const SupervisorAddInternPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [internships, setInternships] = useState([]);
  const [internshipId, setInternshipId] = useState("");
  const [form, setForm] = useState(buildInitial());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [warning, setWarning] = useState("");
  const [lastCreatedSignature, setLastCreatedSignature] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (user?.role !== "supervisor") {
      navigate("/login");
      return;
    }

    loadInternships();
  }, [user, navigate]);

  const loadInternships = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await client.get("/workflow/supervisors/internships");
      const list = Array.isArray(res.data) ? res.data : [];
      setInternships(list);

      if (list.length > 0) {
        setInternshipId(list[0].id);
      } else {
        setError("Aucun Project Stage disponible");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Impossible de charger les Project Stages");
    } finally {
      setLoading(false);
    }
  };

  const onChange = (event) => {
    const { name, value } = event.target;
    setError("");
    setWarning("");
    setForm((current) => ({ ...current, [name]: value }));

    if (name === "email") {
      setLastCreatedSignature("");
    }
  };

  const onFile = (event) => {
    const file = event.target.files && event.target.files[0] ? event.target.files[0] : null;
    setError("");
    setWarning("");

    if (!file) {
      setForm((current) => ({ ...current, cv: null }));
      return;
    }

    const extension = getFileExtension(file.name);
    if (!ALLOWED_CV_EXTENSIONS.has(extension)) {
      setError("Le CV doit être un fichier PDF, DOC ou DOCX.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_CV_SIZE_BYTES) {
      setError("Le CV dépasse 5 Mo. Choisissez un fichier plus léger.");
      event.target.value = "";
      return;
    }

    setForm((current) => ({ ...current, cv: file }));
  };

  const submit = async (event) => {
    event.preventDefault();

    const normalizedEmail = form.email.trim().toLowerCase();
    const creationSignature = `${internshipId}:${normalizedEmail}`;

    if (!internshipId) {
      setError("Aucun Project Stage disponible");
      return;
    }

    if (!normalizedEmail) {
      setError("Email requis");
      return;
    }

    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      setError("La date de fin doit être postérieure à la date de début.");
      return;
    }

    if (creationSignature === lastCreatedSignature) {
      setError("Ce stagiaire vient déjà d'être créé pour ce Project Stage.");
      return;
    }

    try {
      setSubmitting(true);
      setUploadProgress(0);
      setError("");
      setSuccess("");
      setWarning("");

      const payload = new FormData();
      payload.append("email", normalizedEmail);
      payload.append("fullName", form.fullName.trim());
      if (form.startDate) payload.append("startDate", form.startDate);
      if (form.endDate) payload.append("endDate", form.endDate);
      if (form.cv) payload.append("cv", form.cv);

      const { data } = await client.post(`/workflow/supervisors/internships/${internshipId}/students`, payload, {
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) {
            return;
          }

          setUploadProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
        },
        headers: { "Content-Type": "multipart/form-data" }
      });

      setSuccess("Stagiaire ajouté avec succès.");
      setWarning(data?.warning || "");
      setLastCreatedSignature(creationSignature);
      setForm(buildInitial());
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Erreur lors de l'ajout du stagiaire");
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  const selectedInternship = internships.find((item) => item.id === internshipId);
  const isSubmitDisabled = loading || submitting || !internshipId;

  return (
    <div className="page-wrapper">
      <div className="card">
        <h2>Add Intern</h2>
        <p className="section-subtitle">
          Ajoutez un stagiaire à un Project Stage existant avec contrôle des dates et du fichier CV.
        </p>

        {error && <div className="form-error">{error}</div>}
        {success && <div className="form-success">{success}</div>}
        {warning && <div className="form-error">{warning}</div>}

        {loading ? (
          <p>Chargement...</p>
        ) : (
          <form onSubmit={submit} className="supervisor-add-form" style={{ marginTop: 16 }}>
            <div className="field-grid">
              <label className="field-card">
                <span>Project Stage</span>
                <select value={internshipId} onChange={(event) => setInternshipId(event.target.value)} disabled={submitting}>
                  {internships.map((internship) => (
                    <option key={internship.id} value={internship.id}>
                      {internship.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field-card">
                <span>Nom complet</span>
                <input name="fullName" value={form.fullName} onChange={onChange} placeholder="Prénom Nom" required />
              </label>

              <label className="field-card">
                <span>Email</span>
                <input name="email" type="email" value={form.email} onChange={onChange} required />
              </label>

              <label className="field-card">
                <span>Date de début</span>
                <input name="startDate" type="date" value={form.startDate} onChange={onChange} required />
              </label>

              <label className="field-card">
                <span>Date de fin</span>
                <input name="endDate" type="date" value={form.endDate} onChange={onChange} required />
              </label>

              <label className="field-card field-card-upload">
                <span>CV</span>
                <input type="file" accept=".pdf,.doc,.docx" onChange={onFile} required />
                <small>PDF, DOC ou DOCX. Taille max 5MB.</small>
              </label>
            </div>

            {selectedInternship && (
              <div className="parsed-data-box" style={{ marginTop: 12 }}>
                <strong>{selectedInternship.title}</strong>
                <p>{selectedInternship.description || "Aucune description disponible."}</p>
              </div>
            )}

            {submitting && uploadProgress > 0 && (
              <p className="helper-text" style={{ marginTop: 12 }}>
                Téléversement du CV: {uploadProgress}%
              </p>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button type="submit" className="primary-btn" disabled={isSubmitDisabled}>
                {submitting ? "Ajout..." : "Add Intern"}
              </button>
              <button type="button" className="secondary-btn" onClick={() => navigate(-1)}>
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SupervisorAddInternPage;
