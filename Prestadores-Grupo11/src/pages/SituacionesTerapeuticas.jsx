import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import PrestadoresLayout from "../components/PrestadoresLayout";
import HeaderPrestadores from "../components/HeaderPrestadores";
import SideBar from "../components/SideBar";
import { ArrowLeft, Pen } from "lucide-react";
import { FiPlus } from "react-icons/fi";
import { motion } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import { Tooltip } from "react-tooltip";
import Swal from "sweetalert2";
import "react-toastify/dist/ReactToastify.css";
import "../styles/SituacionesTerapeuticas.css";
import "../components/Tabla.css";
import {
  getSituacionesByAfiliadoId,
  getSituacionesByIntegranteId,
  getSituacionesDePrestadorByIntegranteId,
  archivarSituacion,
  actualizarSituacion,
} from "../services/SituacionesApi";

export default function SituacionesTerapeuticas() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [paciente, setPaciente] = useState(null);
  const [situaciones, setSituaciones] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(false);

  // Estados para poder abrir el modal de modificacion
  const [showModal, setShowModal] = useState(false);
  const [situacionSeleccionada, setSituacionSeleccionada] = useState(null);
  const [fechaFinalizacion, setFechaFinalizacion] = useState("");
  const [descripcionEdit, setDescripcionEdit] = useState("");

  //Se fija en el url si el paciente es afiliado o integrante
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tipoPaciente = queryParams.get("tipoPaciente"); // "afiliado" o "integrante"
  const esIntegrante = tipoPaciente === "integrante";

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();

    const fetchSituaciones = async () => {
      try {
        setCargando(true);
        setError(false);

        const user = JSON.parse(localStorage.getItem("miapp_user"));
        if (!user?.id) {
          toast.error("Usuario no logueado. Por favor, inicie sesión.", {
            toastId: "noAuth",
          });
          setError(true);
          return;
        }

        const prestadorId = user.id;
        let responseData;

        if (esIntegrante) {
          responseData = await getSituacionesDePrestadorByIntegranteId(prestadorId, id);
        } else {
          responseData = await getSituacionesByAfiliadoId(
            prestadorId,
            id,
            controller.signal
          );
        }

        const data = responseData?.data || responseData;
        console.log("📦 Datos recibidos del backend:", data);

        let listaSituaciones = [];
        let pacienteInfo = {};

        if (Array.isArray(data)) {
          listaSituaciones = data.map((s) => ({
            id: s.id,
            fecha_inicio: s.fecha_inicio || null,
            fecha_final: s.fecha_final || null,
            fecha_inicio_str: s.fecha_inicio ? new Date(s.fecha_inicio).toLocaleDateString() : "—",
            fecha_final_str: s.fecha_final ? new Date(s.fecha_final).toLocaleDateString() : "—",
            especialidad: s.especialidad || "—",
            descripcion: s.observaciones || "—",
            estado: s.estado || "Pendiente",
            prestador_nombre: s.prestador?.username || "—",
            pacienteNombre: `${s.afiliado?.nombre || s.integrante?.nombre || ""
              } ${s.afiliado?.apellido || s.integrante?.apellido || ""}`.trim(),
            pacienteDNI: s.afiliado?.dni || s.integrante?.dni || "—",
          }));

          const ref = data[0];
          pacienteInfo = {
            nombre: `${ref?.afiliado?.nombre || ref?.integrante?.nombre || ""
              } ${ref?.afiliado?.apellido || ref?.integrante?.apellido || ""
              }`.trim(),
            afiliadoId: ref?.afiliadoId || ref?.integranteId || id,
            dni: ref?.afiliado?.dni || ref?.integrante?.dni || "—",
          };
        } else if (
          data &&
          data.situaciones &&
          Array.isArray(data.situaciones)
        ) {
          listaSituaciones = data.situaciones.map((s) => ({
            id: s.id,
            fecha_inicio: s.fecha_inicio || null,
            fecha_final: s.fecha_final || null,
            fecha_inicio_str: s.fecha_inicio ? new Date(s.fecha_inicio).toLocaleDateString() : "—",
            fecha_final_str: s.fecha_final ? new Date(s.fecha_final).toLocaleDateString() : "—",
            especialidad: s.especialidad || "—",
            descripcion: s.observaciones || "—",
            estado: s.estado || "Pendiente",
            prestador_nombre: s.prestador?.username || "—",
            pacienteNombre: `${data.nombre || ""} ${data.apellido || ""
              }`.trim(),
            pacienteDNI: data.dni || "—",
          }));

          pacienteInfo = {
            nombre: `${data.nombre || ""} ${data.apellido || ""}`.trim(),
            id: data.id || id,
            dni: data.dni || "—",
          };
        } else {
          throw new Error("Respuesta inválida del backend");
        }

        console.log("📋 Datos del paciente:", pacienteInfo);
        setPaciente(pacienteInfo);
        setSituaciones(listaSituaciones);
      } catch (err) {
        if (err.name === "CanceledError" || err.name === "AbortError") return;
        console.error("Error cargando situaciones:", err);
        toast.error("No se pudieron cargar los datos del paciente.", {
          position: "bottom-right",
          autoClose: 2500,
        });
        setError(true);
      } finally {
        if (!controller.signal.aborted) setCargando(false);
      }
    };

    fetchSituaciones();
    return () => controller.abort();
  }, [id, esIntegrante]);

  // === Acción: Nueva Situación ===
  const handleNuevaSituacion = () => {
    if (!paciente?.id && !paciente?.dni) {
      toast.error("No se pudo obtener el identificador del paciente");
      return;
    }

    let identificador = paciente.id; // usamos el ID interno, no el DNI
    navigate(`/prestadores/situaciones/alta/${identificador}?tipoPaciente=${tipoPaciente}`);
  };

  const abrirModalEdicion = (situacion) => {
    setSituacionSeleccionada(situacion);
    setDescripcionEdit(situacion.descripcion || "");

    setFechaFinalizacion(
      situacion.fecha_final
        ? new Date(situacion.fecha_final).toISOString().slice(0, 16)
        : ""
    );

    setShowModal(true);
  };

  const guardarCambios = async () => {
    try {
      if (!situacionSeleccionada) return;

      await actualizarSituacion(situacionSeleccionada.id, {
        fecha_final: fechaFinalizacion,
        observaciones: descripcionEdit
      });

      setSituaciones(prev =>
        prev.map(s =>
          s.id === situacionSeleccionada.id
            ? {
              ...s,
              fecha_final: fechaFinalizacion, // fecha REAL
              fecha_final_str: new Date(fechaFinalizacion).toLocaleDateString(), // vista
              descripcion: descripcionEdit
            }
            : s
        )
      );

      toast.success("Situación actualizada correctamente");

      setShowModal(false);
    } catch (error) {
      console.error("Error actualizando situación:", error);
      toast.error("No se pudo actualizar la situación");
    }
  };



  const handleArchivar = async (id) => {
    try {
      const situacion = situaciones.find((s) => s.id === id);

      console.log("Situacion", situacion)
      console.log("Estado de la situacion: ", situacion.estado)
      //  Validación previa: solo se archivan las finalizadas
      if (situacion && situacion.estado !== "baja") {
        toast.warn("Solo se pueden archivar situaciones finalizadas.", {
          position: "bottom-right",
        });
        return;
      }

      const confirm = await Swal.fire({
        title: "¿Archivar situación?",
        text: "Esto moverá la situación al historial clínico del paciente.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, archivar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#6fb6b6",
        cancelButtonColor: "#fbc3c2",
      });

      if (!confirm.isConfirmed) return;

      // Llamada al método correcto (PATCH)
      await archivarSituacion(id);

      // Actualiza el estado local de la lista
      setSituaciones((prev) =>
        prev.map((s) => (s.id === id ? { ...s, estado: "baja" } : s))
      );

      toast.success("Situación archivada correctamente.", {
        position: "bottom-right",
        autoClose: 2000,
      });
    } catch (error) {
      console.error("Error al archivar la situación:", error);
      toast.error("No se pudo archivar la situación.", {
        position: "bottom-right",
      });
    }
  };

  const handleEditarEstado = async (situacionId, nuevoEstado) => {
    try {
      await actualizarSituacion(situacionId, { estado: nuevoEstado });
      setSituaciones((prev) =>
        prev.map((s) =>
          s.id === situacionId ? { ...s, estado: nuevoEstado } : s
        )
      );
      toast.success(`Estado actualizado a "${nuevoEstado}"`, {
        position: "bottom-right",
        autoClose: 2000,
      });
    } catch (error) {
      console.error("Error actualizando estado:", error);
      toast.error("No se pudo actualizar el estado.", {
        position: "bottom-right",
      });
    }
  };

  if (cargando) {
    return (
      <PrestadoresLayout header={<HeaderPrestadores />}>
        <div className="d-flex">
          <SideBar />
          <div className="container mt-5 text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-3">Cargando datos del paciente...</p>
          </div>
        </div>
      </PrestadoresLayout>
    );
  }

  if (error && !paciente) {
    return (
      <PrestadoresLayout header={<HeaderPrestadores />}>
        <div className="d-flex">
          <SideBar />
          <div className="container mt-5 text-center">
            <h4>No se pudieron cargar los datos del paciente.</h4>
            <motion.button
              className="btn-volver mt-3"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={18} className="me-2" /> Volver
            </motion.button>
          </div>
        </div>
      </PrestadoresLayout>
    );
  }

  return (
    <PrestadoresLayout header={<HeaderPrestadores />}>
      <div className="d-flex">
        <SideBar />
        <div className="flex-grow-1 p-2 p-md-4 w-100" style={{ minWidth: 0, maxWidth: '100vw', overflow: "hidden" }}>
          <ToastContainer />
          <motion.button
            className="btn-volver mb-3"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={18} className="me-2" /> Volver
          </motion.button>

          <h3>
            {esIntegrante
              ? "Situaciones Terapéuticas del Integrante"
              : "Situaciones Terapéuticas del Afiliado"}
          </h3>

          <div className="nueva-situacion-btn-container">
            <button
              className="btn-nueva-situacion"
              onClick={handleNuevaSituacion}
            >
              <FiPlus style={{ marginRight: "6px" }} /> Nueva Situación
            </button>
          </div>

          <div className="tabla-wrapper mt-4">
            <div className="tableScroll">
              <motion.table
                className="table table-hover align-middle shadow-sm rounded text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <thead className="table-secondary">
                <tr>
                  <th>Paciente</th>
                  <th>DNI</th>
                  <th>Fecha inicio</th>
                  <th>Fecha finalizacion</th>
                  <th>Especialidad</th>
                  <th>Descripción</th>
                  <th>Prestador</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {situaciones.length > 0 ? (
                  situaciones.map((s) => (
                    <tr key={s.id}>
                      <td>{s.pacienteNombre}</td>
                      <td>{s.pacienteDNI}</td>
                      <td>{s.fecha_inicio_str}</td>
                      <td>{s.fecha_final_str}</td>
                      <td>{s.especialidad}</td>
                      <td>
                        <button
                          className="btn-ver-mas"
                          data-tooltip-id={`desc-${s.id}`}
                          data-tooltip-content={
                            s.descripcion || "Sin descripción"
                          }
                        >
                          Ver más
                        </button>
                        <Tooltip
                          id={`desc-${s.id}`}
                          place="top"
                          style={{
                            backgroundColor: "var(--rosa)",
                            color: "var(--azul-petroleo)",
                            maxWidth: "300px",
                          }}
                        />
                      </td>
                      <td>{s.prestador_nombre}</td>
                      <td>
                        <select
                          value={s.estado || "Pendiente"}
                          onChange={(e) =>
                            handleEditarEstado(s.id, e.target.value)
                          }
                          className={`form-select form-select-sm ${s.estado === "Finalizado"
                            ? "estado-finalizado"
                            : "estado-proceso"
                            }`}
                        >
                          <option value="alta">Pendiente</option>
                          <option value="en proceso">En proceso</option>
                          <option value="baja">Finalizado</option>
                        </select>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => abrirModalEdicion(s)}
                        >
                          <Pen size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" style={{ color: "var(--azul-petroleo)" }}>
                      No hay situaciones registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </motion.table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de modificacion */}
      {showModal && (
        <>
          {/* Difumina el fondo */}
          <div
            className="modal-backdrop fade show"
            style={{ zIndex: 1040 }}
            onClick={() => setShowModal(false)}
          ></div>

          {/* Modal */}
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ zIndex: 1050 }}
          >
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">

                <div className="modal-header">
                  <h5 className="modal-title">Editar Situación</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>

                <div className="modal-body">

                  {/* Fecha de finalización */}
                  <div className="mb-3">
                    <label className="form-label">Fecha de Finalización</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={fechaFinalizacion}
                      onChange={(e) => setFechaFinalizacion(e.target.value)}
                    />
                  </div>

                  {/* Descripción */}
                  <div className="mb-3">
                    <label className="form-label">Descripción</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      maxLength={1000}
                      value={descripcionEdit}
                      onChange={(e) => setDescripcionEdit(e.target.value)}
                    />
                    <div
                      className="text-end mt-1"
                      style={{ fontSize: "0.85rem", color: "#6c757d" }}
                    >
                      {descripcionEdit.length}/1000
                    </div>
                  </div>

                </div>

                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancelar
                  </button>

                  <button className="btn btn-primary" onClick={guardarCambios}>
                    Guardar Cambios
                  </button>
                </div>

              </div>
            </div>
          </div>
        </>
      )}

    </PrestadoresLayout>
  );
}
