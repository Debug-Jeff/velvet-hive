import { lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import StorefrontLayout from '../layouts/StorefrontLayout'
import AuthLayout from '../layouts/AuthLayout'
import CenteredAuthLayout from '../layouts/CenteredAuthLayout'
import DashboardLayout from '../layouts/DashboardLayout'
import { RequireAuth, RequirePermission, RequireRole } from './guards'
import { STAFF_ROLES } from './roleLanding'

import HomePage from '../pages/storefront/HomePage'
import CheckoutPage from '../pages/storefront/CheckoutPage'
import PaymentMethodPage from '../pages/storefront/PaymentMethodPage'
import PaymentPendingPage from '../pages/storefront/PaymentPendingPage'
import MyOrdersPage from '../pages/storefront/MyOrdersPage'
import CustomerOrderDetailPage from '../pages/storefront/OrderDetailPage'
import WishlistPage from '../pages/storefront/WishlistPage'

import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import VerifyEmailPage from '../pages/auth/VerifyEmailPage'
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '../pages/auth/ResetPasswordPage'

import ProfileSettingsPage from '../pages/shared/ProfileSettingsPage'

// Staff-dashboard-only pages are lazy-loaded so their code (including the
// fairly heavy recharts dependency) never ends up in the bundle a customer
// downloads just to browse the storefront.
const DashboardHomePage = lazy(() => import('../pages/dashboard/DashboardHomePage'))
const UsersTablePage = lazy(() => import('../pages/dashboard/users/UsersTablePage'))
const ProductsTablePage = lazy(() => import('../pages/dashboard/products/ProductsTablePage'))
const OrdersTablePage = lazy(() => import('../pages/dashboard/orders/OrdersTablePage'))
const OrderDetailPage = lazy(() => import('../pages/dashboard/orders/OrderDetailPage'))
const InventoryTablePage = lazy(() => import('../pages/dashboard/inventory/InventoryTablePage'))
const FinancialReportPage = lazy(() => import('../pages/dashboard/reports/FinancialReportPage'))
const StockReportPage = lazy(() => import('../pages/dashboard/reports/StockReportPage'))
const SecurityLogsPlaceholderPage = lazy(() => import('../pages/dashboard/security/SecurityLogsPlaceholderPage'))

import ForbiddenPage from '../pages/ForbiddenPage'
import NotFoundPage from '../pages/NotFoundPage'

export const router = createBrowserRouter([
  {
    element: <StorefrontLayout />,
    children: [
      { index: true, path: '/', element: <HomePage /> },
      {
        element: <RequireAuth />,
        children: [
          { path: 'checkout', element: <CheckoutPage /> },
          { path: 'checkout/:orderId/pay', element: <PaymentMethodPage /> },
          { path: 'checkout/:orderId/confirming', element: <PaymentPendingPage /> },
          { path: 'orders', element: <MyOrdersPage /> },
          { path: 'orders/:id', element: <CustomerOrderDetailPage /> },
          { path: 'wishlist', element: <WishlistPage /> },
          { path: 'account', element: <ProfileSettingsPage /> },
        ],
      },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/verify-email', element: <VerifyEmailPage /> },
    ],
  },
  {
    element: <CenteredAuthLayout />,
    children: [
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <RequireRole roles={STAFF_ROLES} />,
        children: [
          {
            path: '/dashboard',
            element: <DashboardLayout />,
            children: [
              { index: true, element: <DashboardHomePage /> },
              {
                path: 'products',
                element: <RequirePermission permission="products:read" />,
                children: [{ index: true, element: <ProductsTablePage /> }],
              },
              {
                path: 'orders',
                element: <RequirePermission permission="orders:read:all" />,
                children: [
                  { index: true, element: <OrdersTablePage /> },
                  { path: ':id', element: <OrderDetailPage /> },
                ],
              },
              {
                path: 'inventory',
                element: <RequirePermission permission="inventory:read" />,
                children: [{ index: true, element: <InventoryTablePage /> }],
              },
              {
                path: 'users',
                element: <RequirePermission permission="users:manage" />,
                children: [{ index: true, element: <UsersTablePage /> }],
              },
              {
                path: 'reports/financial',
                element: <RequirePermission permission="reports:financial:read" />,
                children: [{ index: true, element: <FinancialReportPage /> }],
              },
              {
                path: 'reports/stock',
                element: <RequirePermission permission="reports:stock:read" />,
                children: [{ index: true, element: <StockReportPage /> }],
              },
              {
                path: 'security',
                element: <RequirePermission permission="users:manage" />,
                children: [{ index: true, element: <SecurityLogsPlaceholderPage /> }],
              },
              { path: 'settings', element: <ProfileSettingsPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '/forbidden', element: <ForbiddenPage /> },
  { path: '*', element: <NotFoundPage /> },
])
