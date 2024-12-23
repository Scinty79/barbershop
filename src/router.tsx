import { createBrowserRouter } from 'react-router-dom';
import { lazy } from 'react';
import App from './App';
import { MainLayout } from './layouts/MainLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navigate } from 'react-router-dom';

const Servizi = lazy(() => import('./pages/Servizi'));
const Punti = lazy(() => import('./pages/Punti'));
const Profilo = lazy(() => import('./pages/Profilo'));
const ClientDashboard = lazy(() => import('./pages/ClientDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Login = lazy(() => import('./pages/Login'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <App />,
      },
      {
        path: '/login',
        element: <Navigate to="/" replace />,
      },
      {
        path: '/servizi',
        element: <Servizi />,
      },
      {
        path: '/punti',
        element: <ProtectedRoute allowedRoles={['CLIENTE']}><Punti /></ProtectedRoute>,
      },
      {
        path: '/profilo',
        element: <ProtectedRoute><Profilo /></ProtectedRoute>,
      },
    ],
  },
  {
    path: '/client-dashboard',
    element: <ProtectedRoute allowedRoles={['CLIENTE']}><DashboardLayout /></ProtectedRoute>,
    children: [
      {
        index: true,
        element: <ClientDashboard />,
      }
    ],
  },
  {
    path: '/admin/dashboard',
    element: <ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout /></ProtectedRoute>,
    children: [
      {
        index: true,
        element: <AdminDashboard />,
      }
    ],
  },
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
  }
});
