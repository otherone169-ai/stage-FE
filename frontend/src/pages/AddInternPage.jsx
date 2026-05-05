import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/client";

const AddInternPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    schoolYear: "",
    specialization: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Adjust endpoint based on your backend API
      await apiClient.post("/workflow/interns", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        schoolYear: formData.schoolYear,
        specialization: formData.specialization,
      });

      // Redirect to student/my-project after successful creation
      navigate("/app/student/my-project");
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'ajout du stagiaire");
      console.error("Error adding intern:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1>Ajouter un Stagiaire</h1>
      
      <div className="form-wrapper">
        <form onSubmit={handleSubmit} className="form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="firstName">Prénom *</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              placeholder="Jean"
            />
          </div>

          <div className="form-group">
            <label htmlFor="lastName">Nom *</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              placeholder="Dupont"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="jean.dupont@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Téléphone</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+33 6 XX XX XX XX"
            />
          </div>

          <div className="form-group">
            <label htmlFor="schoolYear">Année Scolaire *</label>
            <select
              id="schoolYear"
              name="schoolYear"
              value={formData.schoolYear}
              onChange={handleChange}
              required
            >
              <option value="">Sélectionner une année</option>
              <option value="2024-2025">2024-2025</option>
              <option value="2025-2026">2025-2026</option>
              <option value="2026-2027">2026-2027</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="specialization">Spécialisation</label>
            <input
              type="text"
              id="specialization"
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
              placeholder="Développement Web"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Ajout en cours..." : "Ajouter le Stagiaire"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate("/app/student/my-project")}
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddInternPage;
