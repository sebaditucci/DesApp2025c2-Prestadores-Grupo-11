import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import PrestadoresLayout from "../components/PrestadoresLayout";
import HeaderPrestadores from "../components/HeaderPrestadores";
import SideBar from "../components/SideBar";
import { ArrowLeft, ClipboardList, Users } from "lucide-react";
import { motion } from "framer-motion";
import { getAllIntegrantes } from "../services/IntegrantesApi";
import { getAllAfiliados } from "../services/AfiliadosApi";
//import { getSituacionesByPacienteId } from "../services/SituacionesApi";
import { getNombrePrestadorById } from "../services/PrestadoresApi";
import { getSituacionesByPacienteId } from "../services/SituacionesApi"
import { getTurnosByPacienteId } from "../services/TurnosApi";
import "../styles/SituacionesTerapeuticas.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import TablaHistorial from "../components/TablaHistorial";
import { getHistorialClinicoById } from "../services/HistorialClinicaApi";


export default function HistorialClinico() {
  const { dni } = useParams();
  const navigate = useNavigate();

  //Me traigo el tipo de paciente de los query parameters
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tipo = queryParams.get("tipo"); // "Afiliado", "Integrante"

  const [paciente, setPaciente] = useState(null);
  //const [situaciones, setSituaciones] = useState([]);
  //const [consultas, setConsultas] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  //Obtiene el user guardado en el localStorage
  const storedUser = JSON.parse(localStorage.getItem("miapp_user") || "null");
  const user = storedUser;

  // Cargar datos del paciente
  useEffect(() => {
    const cargarPaciente = async () => {
      try {
        const integrantes = await getAllIntegrantes();
        const afiliados = await getAllAfiliados();
        const encontrado = integrantes.find((integrante) => integrante.dni === dni) || afiliados.find(afiliado => afiliado.dni === dni)

        if (!encontrado) {
          console.log(`No se encontro el integrante DNI ${dni}`)
        }

        console.log(encontrado)
        setPaciente(encontrado);
      } catch (error) {
        console.error('Error al cargar integrantes:', error);
        setError(error.message)
      } finally {
        setLoading(false);
      }
    };

    cargarPaciente();

  }, [dni]);

  // Estado: cargando
  if (loading) {
    return (
      <PrestadoresLayout header={HeaderPrestadores}>
        <div className="d-flex">
          <div className="flex-grow-1 p-4 text-center">
            <p>Cargando información del afiliado...</p>
          </div>
        </div>
      </PrestadoresLayout>
    );
  }

  // Estado: error
  if (error) {
    return (
      <PrestadoresLayout header={HeaderPrestadores}>
        <div className="d-flex">
          <SideBar />
          <div className="flex-grow-1 p-4 text-center">
            <p className="text-danger">{error}</p>
            <button className="btn-volver mt-3" onClick={() => navigate(-1)}>
              <ArrowLeft size={18} className="me-2" /> Volver
            </button>
          </div>
        </div>
      </PrestadoresLayout>
    );
  }

  // Estado: sin paciente (por seguridad adicional)
  if (!paciente) {
    return (
      <PrestadoresLayout header={HeaderPrestadores}>
        <div className="d-flex">
          <SideBar />
          <div className="flex-grow-1 p-4 text-center">
            <p>No se encontraron datos del paciente con DNI {dni}</p>
            <button className="btn-volver mt-3" onClick={() => navigate(-1)}>
              <ArrowLeft size={18} className="me-2" /> Volver
            </button>
          </div>
        </div>
      </PrestadoresLayout>
    );
  }

  //Vista principal
  return (
    <PrestadoresLayout header={HeaderPrestadores}>
      <div className="d-flex">
        <SideBar />
        <div className="flex-grow-1 p-2 p-md-4 w-100" style={{ minWidth: 0, maxWidth: "100vw", overflow: "hidden" }}>
          {/* Botón volver */}
          <motion.button
            className="btn-volver mb-3"
            whileHover={{ scale: 1.05, backgroundColor: "var(--verde-agua)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={18} className="me-2" /> Volver
          </motion.button>
          
          <h3>Detalle Historial Clinico</h3>

          {/* Card paciente */}
          <motion.div
            className="paciente-card p-3 mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{
              scale: 1.02,
              boxShadow: "0 0 10px rgba(251,195,194,0.6)",
            }}
          >
            <div className="d-flex align-items-center gap-3">
              <Users size={40} color="var(--azul-petroleo)" />
              <div>
                <h4>{paciente.nombre} {paciente.apellido ? paciente.apellido : ""}</h4>
                <p>
                  Edad: <strong>{paciente.edad}</strong> | DNI:{" "}
                  <strong>{paciente.dni}</strong>
                </p>
              </div>
            </div>
          </motion.div>

          {/* Tabla ultimas consultas */}
          <motion.div
            className="tabla-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >

            <TablaHistorial
              pacienteId={paciente.id}
              tipo={tipo}
            />

          </motion.div>
        </div>
      </div>
    </PrestadoresLayout>
  );
}
