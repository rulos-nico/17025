import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'
import RoleSelector from './components/RoleSelector/RoleSelector'
import Home from './pages/Home/Home'
import Dashboard from './pages/Dashboard/Dashboard'
import Entregables from './pages/Entregables/Entregables'
import EntregableDetalle from './pages/Entregables/EntregableDetalle'
import CrearEntregable from './pages/Entregables/CrearEntregable'
import Muestras from './pages/Muestras/Muestras'
import MuestraDetalle from './pages/Muestras/MuestraDetalle'
import Informes from './pages/Informes/Informes'
import InformeDetalle from './pages/Informes/InformeDetalle'
import Clientes from './pages/Clientes/Clientes'
import ClienteDetalle from './pages/Clientes/ClienteDetalle'
import CalidadControl from './pages/Calidad/CalidadControl'
import Usuarios from './pages/Usuarios/Usuarios'
import Plantillas from './pages/Plantillas/Plantillas'
import Equipos from './pages/Equipos/Equipos'
import Cronograma from './pages/Cronograma/Cronograma'
import Personal from './pages/Personal/Personal'
import Login from './pages/Auth/Login'
import './styles/App.css'

function App() {
  return (
    <Router>
      <RoleSelector />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          
          {/* Dashboard */}
          <Route path="dashboard" element={
            <ProtectedRoute permission="canViewDashboard">
              <Dashboard />
            </ProtectedRoute>
          } />
          
          {/* Entregables */}
          <Route path="entregables" element={
            <ProtectedRoute permission="canViewEntregables">
              <Entregables />
            </ProtectedRoute>
          } />
          <Route path="entregables/:id" element={
            <ProtectedRoute permission="canViewEntregables">
              <EntregableDetalle />
            </ProtectedRoute>
          } />
          <Route path="entregables/crear" element={
            <ProtectedRoute permission="canCreateEntregables">
              <CrearEntregable />
            </ProtectedRoute>
          } />
          
          {/* Muestras */}
          <Route path="muestras" element={
            <ProtectedRoute permission="canViewMuestras">
              <Muestras />
            </ProtectedRoute>
          } />
          <Route path="muestras/:id" element={
            <ProtectedRoute permission="canViewMuestras">
              <MuestraDetalle />
            </ProtectedRoute>
          } />
          
          {/* Informes */}
          <Route path="informes" element={
            <ProtectedRoute permission="canViewInformes">
              <Informes />
            </ProtectedRoute>
          } />
          <Route path="informes/:id" element={
            <ProtectedRoute permission="canViewInformes">
              <InformeDetalle />
            </ProtectedRoute>
          } />
          
          {/* Clientes */}
          <Route path="clientes" element={
            <ProtectedRoute permission="canViewClientes">
              <Clientes />
            </ProtectedRoute>
          } />
          <Route path="clientes/:id" element={
            <ProtectedRoute permission="canViewClientes">
              <ClienteDetalle />
            </ProtectedRoute>
          } />
          
          {/* Calidad */}
          <Route path="calidad" element={
            <ProtectedRoute permission="canViewCalidad">
              <CalidadControl />
            </ProtectedRoute>
          } />
          
          {/* Plantillas y Documentación */}
          <Route path="plantillas" element={
            <ProtectedRoute permission="canViewPlantillas">
              <Plantillas />
            </ProtectedRoute>
          } />
          
          {/* Equipos */}
          <Route path="equipos" element={
            <ProtectedRoute permission="canViewEquipos">
              <Equipos />
            </ProtectedRoute>
          } />
          
          {/* Cronograma */}
          <Route path="cronograma" element={
            <ProtectedRoute permission="canViewCronograma">
              <Cronograma />
            </ProtectedRoute>
          } />
          
          {/* Personal */}
          <Route path="personal" element={
            <ProtectedRoute permission="canViewPersonal">
              <Personal />
            </ProtectedRoute>
          } />
          
          {/* Usuarios */}
          <Route path="usuarios" element={
            <ProtectedRoute permission="canManageUsuarios">
              <Usuarios />
            </ProtectedRoute>
          } />
          
          {/* Personal */}
          <Route path="personal" element={<Personal />} />
          
          {/* Usuarios */}
          <Route path="usuarios" element={<Usuarios />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
