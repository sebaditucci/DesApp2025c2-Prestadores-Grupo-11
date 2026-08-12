import api from "./Api";

/**
 * Busca afiliados (con integrantes y situaciones)
 * por número de afiliado o apellido, filtrados por prestador.
 * GET /situaciones/:prestadorId/Afiliado/:nroOApellido
 */
export const getIntegrantes = async (prestadorId, valorBusqueda) => {
  try {
    const q = (valorBusqueda || "").trim();

    if (!prestadorId) throw new Error("Falta el ID del prestador.");
    if (!q) {
      throw new Error("La búsqueda no puede estar vacía.");
    }
    
    const pareceNombre = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(q);
    if (pareceNombre && q.length < 3) {
      throw new Error("La búsqueda por nombre requiere al menos 3 caracteres.");
    }
    if (!pareceNombre && q.length < 8) {
      throw new Error("La búsqueda por afiliado requiere al menos 8 caracteres.");
    }

    const res = await api.get(
      `/situaciones/${prestadorId}/Afiliado/${encodeURIComponent(q)}`
    );

    // El backend devuelve un solo afiliado, no un array
    if (!res.data) return [];

    // Normalizamos la respuesta a un array para que el front pueda mapearlo
    return res.data;
  } catch (error) {
    console.error("Error al obtener integrantes:", error);
    throw error;
  }
};

/**
 * Obtiene todos los integrantes (no usado aquí)
 */
export const getAllIntegrantes = async () => {
  try {
    const res = await api.get("/integrantes");
    return res.data;
  } catch (error) {
    console.error("Error al obtener integrantes:", error);
    throw error;
  }
};

/**
 * Obtiene un integrante por ID
 */
export const getIntegranteById = async (afiliadoId) => {
  try {
    // Esta ruta es la que existe en backend para buscar por ID
    const endpoint = `/situaciones/Afiliado/${afiliadoId}`;
    const response = await api.get(endpoint);

    console.log("Detalle afiliado:", response.data);
    return response.data;
  } catch (error) {
    console.error(`Error obteniendo afiliado ${afiliadoId}:`, error);
    throw error;
  }
};
