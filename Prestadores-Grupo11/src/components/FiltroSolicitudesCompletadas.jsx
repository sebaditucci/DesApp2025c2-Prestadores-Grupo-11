import React from "react";
import "./FiltroSolicitudesCompletadas.css";

export default function FiltroSolicitudesCompletadas({ value, onChange }) {
  return (
    <div className="d-flex justify-content-center mb-3">

      <div className="form-check ms-3">
        <input
          className="form-check-input"
          type="radio"
          name="filtroCompletadas"
          value="sinFiltro"
          checked={value === "sinFiltro"}
          onChange={(e) => onChange(e.target.value)}
        />
        <label className="form-check-label ms-2">Todos</label>
      </div>

      <div className="form-check ms-3">
        <input
          className="form-check-input"
          type="radio"
          name="filtroCompletadas"
          value="aprobado"
          checked={value === "aprobado"}
          onChange={(e) => onChange(e.target.value)}
        />
        <label className="form-check-label ms-2">Aprobadas</label>
      </div>

      <div className="form-check ms-3">
        <input
          className="form-check-input"
          type="radio"
          name="filtroCompletadas"
          value="rechazado"
          checked={value === "rechazado"}
          onChange={(e) => onChange(e.target.value)}
        />
        <label className="form-check-label ms-2">Rechazadas</label>
      </div>

      <div className="form-check ms-3">
        <input
          className="form-check-input"
          type="radio"
          name="filtroCompletadas"
          value="observado"
          checked={value === "observado"}
          onChange={(e) => onChange(e.target.value)}
        />
        <label className="form-check-label ms-2">Observadas</label>
      </div>

    </div>
  );
}
