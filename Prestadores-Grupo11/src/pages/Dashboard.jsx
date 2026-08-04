import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Container,
} from "@mui/material";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Sector,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DataGrid } from "@mui/x-data-grid";
import PrestadoresLayout from "../components/PrestadoresLayout";
import HeaderPrestadores from "../components/HeaderPrestadores";
import { getFiltrado } from "../services/DashboardApi";

// === FORMATEADORES ===
const formatearFechaCorta = (fechaStr) => {
  if (!fechaStr) return "";
  const fecha = new Date(fechaStr);
  return fecha.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

const obtenerNombreMes = (fechaStr) => {
  if (!fechaStr) return "";
  const fecha = new Date(fechaStr);
  return fecha.toLocaleDateString("es-AR", {
    month: "long",
  });
};

const COLORS = {
  Nudesuave: "#f3e3da",
  Verdematchapastel: "#b0e0e6",
  Azulcielopastel: "#c6e7ff",
  rosa: "#fbc3c2",
  Verdepistacho: "#cfe8cf",
};

const columns = [
  { field: "fecha", headerName: "Fecha", width: 160 },
  { field: "tipo", headerName: "Tipo", width: 150 },
  { field: "descripcion", headerName: "Descripción", width: 300 },
];

const CustomActiveShape = (props) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    value,
  } = props;
  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} fontWeight="bold">
        {value}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(null);

  // Filtros
  const [estado, setEstado] = useState("todos");
  const [desde, setDesde] = useState("2025-01-01");
  const [hasta, setHasta] = useState(new Date().toISOString().split("T")[0]);


  // Data
  const [kpis, setKpis] = useState(null);
  const [grafico, setGrafico] = useState([]);
  const [distribucion, setDistribucion] = useState([]);
  const [registros, setRegistros] = useState([]);

  // ----------------- CARGA DASHBOARD -----------------
  const cargarDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getFiltrado({ estado, desde, hasta });

      // KPIs
      setKpis(data.kpis || {});

      // GRAFICO DE BARRAS
      setGrafico(
        (data.grafico || []).map((item) => ({
          ...item,
          fechaOriginal: new Date(item.fecha).toISOString().split("T")[0],
          nombreMes: obtenerNombreMes(item.fecha),
        }))
      );

      // DISTRIBUCION PARA TORTA
      setDistribucion(
        (data.distribucion || []).map((d) => ({
          ...d,
          color:
            {
              Recibido: COLORS.Azulcielopastel,
              "En Analisis": COLORS.Verdepistacho,
              Observado: COLORS.rosa,
              Aprobado: COLORS.Verdematchapastel,
              Rechazado: COLORS.Nudesuave,
            }[d.estado] || COLORS.Azulcielopastel,
        }))
      );

      // REGISTROS
      setRegistros(
        (data.registros || []).map((row, index) => ({
          id: row.id || `row-${index}`,
          ...row,
          fechaOriginal: row.fecha,
        }))
      );
    } catch (err) {
      console.error(err);
      setError("Error al cargar el dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDashboard();
  }, [estado, desde, hasta]);

  // ----------------- FORMATEO FINAL -----------------
  const graficoFormateado = grafico.map((item, i) => ({
    id: i,
    ...item,
  }));

  const registrosFormateados = registros.map((r) => ({
    ...r,
    fecha: (() => {
      const d = new Date(r.fechaOriginal);
      if (isNaN(d)) return r.fechaOriginal;
      return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${d.getFullYear()}`;
    })(),
  }));

  // BARRAS AUTOMÁTICAS Y EJE Y DE 1 EN 1
  const maxY = Math.max(
    1,
    ...graficoFormateado.map((d) => Math.max(d.reintegros, d.recetas, d.autorizaciones, 0))
  );
  const barSize = Math.max(10, Math.min(50, 500 / graficoFormateado.length));

  return (
    <PrestadoresLayout header={<HeaderPrestadores />}>
      <Container maxWidth="xl" sx={{ mt: 3 }}>
        <Box
          sx={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: { xs: 2, sm: 3, md: 4 },
            borderRadius: "20px",
            background: "linear-gradient(145deg, #ffffff, #fff8fc)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            border: "2px solid #ff69b4",
          }}
        >
          {loading && <Typography>Cargando dashboard...</Typography>}
          {error && <Typography color="error">{error}</Typography>}

          {/* FILTROS */}
          <Grid container spacing={3} mb={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={estado}
                  label="Estado"
                  onChange={(e) => setEstado(e.target.value)}
                >
                  <MenuItem value="todos">Todos</MenuItem>
                  <MenuItem value="recibido">Recibido</MenuItem>
                  <MenuItem value="en analisis">En análisis</MenuItem>
                  <MenuItem value="rechazado">Rechazado</MenuItem>
                  <MenuItem value="aprobado">Aprobado</MenuItem>
                  <MenuItem value="observado">Observado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="date"
                label="Desde"
                InputLabelProps={{ shrink: true }}
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="date"
                label="Hasta"
                InputLabelProps={{ shrink: true }}
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
              />
            </Grid>
          </Grid>

          {/* KPIs */}
          {kpis && (
            <Grid container spacing={3} mb={4}>
              {[
                { label: "Reintegros", value: kpis.reintegros, color: COLORS.Azulcielopastel },
                { label: "Recetas", value: kpis.recetas, color: COLORS.Verdepistacho },
                { label: "Autorizaciones", value: kpis.autorizaciones, color: COLORS.rosa },
              ].map((kpi, i) => (
                <Grid size={{ xs: 12, md: 4 }} key={i}>
                  <Card
                    sx={{
                      padding: { xs: 2, md: 4 },
                      borderRadius: 5,
                      textAlign: "center",
                      backgroundColor: kpi.color,
                      marginBottom: 2,
                    }}
                  >
                    <CardContent>
                      <Typography variant="h3" fontWeight={700}>
                        {kpi.value}
                      </Typography>
                      <Typography variant="subtitle1">{kpi.label}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {/* GRÁFICOS */}
          <Grid container spacing={3} mb={4}>
            {/* BARRAS */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Card
                sx={{
                  padding: { xs: 2, md: 4 },
                  border: "2px solid #ff69b4",
                  borderRadius: "16px",
                  background: "linear-gradient(145deg, #ffffff, #fff5fb)",
                }}
              >
                <Typography variant="h6" mb={2}>
                  Movimientos por período
                </Typography>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={graficoFormateado} barGap={5} barCategoryGap="20%">
                    <XAxis
                      dataKey="fechaOriginal"
                      tickFormatter={(fecha) => {
                        const d = new Date(fecha);
                        if (isNaN(d)) return fecha;
                        return `${d.getDate()}/${d.getMonth() + 1}`;
                      }}
                    />
                    <YAxis
                      allowDecimals={false}
                      domain={[0, maxY]}
                      tickCount={maxY + 1}
                    />
                    <Tooltip
                      formatter={(value, name) => [value, name]}
                      labelFormatter={(label) => {
                        const d = new Date(label);
                        return isNaN(d) ? label : `${d.getDate()}/${d.getMonth() + 1}`;
                      }}
                    />
                    <Bar dataKey="reintegros" fill={COLORS.Azulcielopastel} barSize={barSize} />
                    <Bar dataKey="recetas" fill={COLORS.Verdepistacho} barSize={barSize} />
                    <Bar dataKey="autorizaciones" fill={COLORS.rosa} barSize={barSize} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Grid>

            {/* TORTA */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card
                sx={{
                  padding: { xs: 2, md: 4 },
                  border: "2px solid #ff69b4",
                  borderRadius: "16px",
                  background: "linear-gradient(145deg, #ffffff, #fff5fb)",
                }}
              >
                <Typography variant="h6" mb={2}>
                  Distribución por estado
                </Typography>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={distribucion}
                      dataKey="total"
                      nameKey="estado"
                      cx="50%"
                      cy="50%"
                      outerRadius="75%"
                      activeIndex={activeIndex}
                      activeShape={CustomActiveShape}
                      onMouseEnter={(_, index) => setActiveIndex(index)}
                      onMouseLeave={() => setActiveIndex(null)}
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, index, value, percent, payload }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        const fillColor = payload.color;
                        return (
                          <text
                            x={x}
                            y={y}
                            fill={fillColor}
                            textAnchor={x > cx ? "start" : "end"}
                            dominantBaseline="central"
                            fontWeight="bold"
                          >
                            {value ?? 0} ({(percent * 100).toFixed(0)}%)
                          </text>
                        );
                      }}
                    >
                      {distribucion.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [value, name]}
                      contentStyle={{ borderRadius: "8px", border: "1px solid #fbc3c2" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
          </Grid>

          {/* TABLA */}
          <Card
            sx={{
              padding: 3,
              border: "2px solid #ff69b4",
              borderRadius: "16px",
              background: "linear-gradient(145deg, #ffffff, #fff7fc)",
            }}
          >
            <Typography variant="h6" mb={2}>
              Detalle por período
            </Typography>
            <DataGrid
              rows={registrosFormateados}
              columns={columns}
              getRowId={(row) => row.id}
              pageSizeOptions={[5, 10, 15, 20, 25, 30, 50]}
              initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
              autoHeight
              sx={{
                borderRadius: "12px",
                backgroundColor: "#fff",
                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: "#ffe6f2",
                  color: "#b30059",
                  fontWeight: "bold",
                  fontSize: "0.95rem",
                },
                "& .MuiDataGrid-row:hover": {
                  backgroundColor: "#fff0f8",
                },
                "& .MuiDataGrid-cell": {
                  borderColor: "#f7d1e6",
                },
              }}
            />
          </Card>
        </Box>
      </Container>
    </PrestadoresLayout>
  );
}