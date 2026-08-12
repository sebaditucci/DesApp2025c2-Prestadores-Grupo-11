import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getHistorialClinicoById } from "../services/HistorialClinicaApi";
import DetalleHistorialModal from "./DetalleHistorialModal";
import HistorialFiltroRadios from "./HistorialFiltroRadios";
import "./Tabla.css";


export default function TablaHistorial({
  pacienteId,
  tipo
}) {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [detalleSeleccionado, setDetalleSeleccionado] = useState(null);

  const [consultas, setConsultas] = useState([])
  const [filtro, setFiltro] = useState("none");

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;


  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const hayFechas = fechaInicio || fechaFin;

  // Con la informacion del paciente, busca su historial clinico
  useEffect(() => {
    if (!pacienteId) return; // Si no hay paciente cargado no hace nada

    const getConsultas = async () => {
      const consultas = await getHistorialClinicoById(
        pacienteId,
        tipo,
        filtro,
        fechaInicio,
        fechaFin
      );
      setConsultas(consultas)
      setCurrentPage(1);
    };

    getConsultas()
  }, [pacienteId, filtro, tipo, fechaInicio, fechaFin])

  const abrirModal = (consulta) => {
    setDetalleSeleccionado(consulta);
    setMostrarModal(true);
  };

  //Funcion para capitalizar la primera letra de cada palabra
  const mayusculas = (str) => str.toLowerCase().replace(/(^|\s)\p{L}/gu, (c) => c.toUpperCase());

  const truncarTexto = (texto, limite = 80) => {
    if (!texto) return "";
    return texto.length > limite ? texto.slice(0, limite) + "..." : texto;
  };

  // Calcular páginas
  const totalPages = Math.ceil(consultas.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const consultasPaginadas = consultas.slice(startIndex, startIndex + pageSize);

  return (
    <>
      {/*Radio para filtrar el historial*/}
      <HistorialFiltroRadios
        filtro={filtro}
        onChange={(nuevo) => setFiltro(nuevo)}
      />

      {/*Filtro de fechas*/}
      <div
        className="d-flex justify-content-center gap-3 mt-2 mb-3 align-items-center w-100"
      >
        <div>
          <label className="form-label mb-0">Fecha inicio:</label>
          <input
            type="date"
            className="form-control"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
        </div>

        <div>
          <label className="form-label mb-0">Fecha fin:</label>
          <input
            type="date"
            className="form-control"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />
        </div>
      </div>

      <motion.div
        className="tableScroll"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <table className="table table-striped" style={{ marginTop: "0px" }}>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Fecha</th>
              <th>Notas</th>
              <th>Especialidad</th>
              <th>Medico</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {consultas.length > 0 ? (
              consultasPaginadas.map((consulta, idx) => (
                <motion.tr
                  key={idx}
                  className="align-middle"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <td>{consulta.tipo}</td>
                  <td>
                    {new Date(consulta.fecha).toLocaleString("es-AR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td>{truncarTexto(consulta.notas)}</td>
                  <td>{mayusculas(consulta.especialidad)}</td>
                  <td>{mayusculas(consulta.medico)}</td>

                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => abrirModal(consulta)}
                    >
                      Ver detalle
                    </button>
                  </td>
                </motion.tr>
              ))
            ) : (
              <tr>
                <td colSpan={6}>
                  {(() => {
                    if (filtro === "none") {
                      return hayFechas
                        ? "No hay ningún resultado para estos filtros."
                        : "Este paciente todavía no tuvo ninguna consulta.";
                    }
                    return "No hay resultados para este filtro.";
                  })()}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </motion.div>

      {consultas.length > 0 && (
        <div className="d-flex justify-content-center align-items-center gap-2 mt-3">
          <button
            className="btn btn-outline-primary btn-sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
          >
            Anterior
          </button>

          <span>
            Página {currentPage} de {totalPages}
          </span>

          <button
            className="btn btn-outline-primary btn-sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
          >
            Siguiente
          </button>
        </div>
      )}


      {/* Modal de detalle */}
      <DetalleHistorialModal
        mostrar={mostrarModal}
        detalle={detalleSeleccionado}
        onClose={() => setMostrarModal(false)}
      />
    </>
  );
}
