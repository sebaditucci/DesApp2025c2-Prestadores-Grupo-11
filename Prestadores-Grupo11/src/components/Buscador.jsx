import React, { useState } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/SituacionesTerapeuticas.css";

export default function Buscador({
  onSearch,
  permitirDNI = false, // Para poder tambien hacer la busqueda por dni, solo en historial clinico.
}) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate(); //BORRAR

  // --- Verifica si es nombre y/o apellido (letras y espacios) ---
  const esNombreCompleto = (valor) =>
    /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{3,}$/.test(valor.trim());

  // --- Verifica si es un número de afiliado válido ---
  const esNumeroAfiliado = (valor) => {
    if (permitirDNI) {
      // Permite solo números puros (DNI)
      return /^\d{4,10}$/.test(valor.trim());
    } else {
      // Formato IOMA-XXXX
      return /^[A-Za-zÁÉÍÓÚáéíóúÑñ]+-\d{4,}$/.test(valor.trim());
    }
  };

  // --- Lógica de búsqueda centralizada ---
  const ejecutarBusqueda = () => {
    const trimmed = query.trim();

    if (!trimmed) {
      toast.error(
        "Por favor, ingresa un nombre, apellido o número de afiliado"
      );
      return;
    }

    if (permitirDNI) {
      if (trimmed.length < 3) {
        toast.warning("Debe tener al menos 3 caracteres para buscar");
        return;
      }
    } else {
      // Si parece nombre completo (solo letras), permitimos 3 caracteres.
      // Si parece número de afiliado, pedimos al menos 8.
      const pareceNombre = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(trimmed);
      if (pareceNombre && trimmed.length < 3) {
        toast.warning("Debe tener al menos 3 caracteres para buscar");
        return;
      }
      if (!pareceNombre && trimmed.length < 8) {
        toast.warning("Debe tener al menos 8 caracteres para buscar afiliado");
        return;
      }
    }

    if (esNombreCompleto(trimmed) || esNumeroAfiliado(trimmed)) {
      if (onSearch) onSearch(trimmed);
    } else {
      toast.error(
        "Formato no válido. Usa solo letras (nombre/apellido) o formato LETRAS-NÚMEROS (ej: IOMA-00111222)"
      );
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      ejecutarBusqueda();
    }
  };

  const handleSearchClick = () => {
    ejecutarBusqueda();
  };

  return (
    <motion.div
      className="buscador"
      animate={{
        scale: isFocused ? 1.05 : 1,
        boxShadow: isFocused
          ? "0 0 15px rgba(251, 195, 194, 0.6)"
          : "0 3px 6px rgba(0,0,0,0.1)",
        borderColor: isFocused ? "var(--verde-agua)" : "var(--rosa)",
      }}
      transition={{ duration: 0.3 }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ejecutarBusqueda();
        }}
        style={{ display: "flex", alignItems: "center", width: "100%" }}
      >
        <input
          id="buscador-input"
          name="buscador"
          type="text"
          placeholder={
            permitirDNI
              ? "Buscar por nombre, apellido o DNI"
              : "Buscar por nombre, apellido o número de afiliado (ej: IOMA-00111222)..."
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          aria-label="Buscar paciente"
        />

        <motion.button
          type="submit"
          whileHover={{ scale: 1.15, backgroundColor: "var(--verde-agua)" }}
          whileTap={{ scale: 0.9 }}
        >
          <Search size={20} />
        </motion.button>
      </form>

      <AnimatePresence>
        {isFocused && query && (
          <motion.div
            className="sugerencia"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.25 }}
          >
            Presiona <strong>Enter</strong> para buscar
          </motion.div>
        )}
      </AnimatePresence>
      {/* === Toasts globales === */}
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
    </motion.div>
  );
}
