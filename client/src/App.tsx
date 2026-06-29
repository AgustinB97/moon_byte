import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { CartDrawer } from '@/components/features/CartDrawer'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'

// ── Eager (críticos para TTFB) ──────────────────────────────
import { AuthPage } from '@/pages/AuthPage'

// ── Lazy (cargados en demanda) ──────────────────────────────
const HomePage              = lazy(() => import('@/pages/HomePage').then(m => ({ default: m.HomePage })))
const ProductsPage          = lazy(() => import('@/pages/ProductsPage').then(m => ({ default: m.ProductsPage })))
const ProductDetailPage     = lazy(() => import('@/pages/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })))
const CartPage              = lazy(() => import('@/pages/CartPage').then(m => ({ default: m.CartPage })))
const CheckoutPage          = lazy(() => import('@/pages/CheckoutPage').then(m => ({ default: m.CheckoutPage })))
const CheckoutSuccessPage   = lazy(() => import('@/pages/CheckoutSuccessPage').then(m => ({ default: m.CheckoutSuccessPage })))
const CheckoutFailurePage   = lazy(() => import('@/pages/CheckoutFailurePage').then(m => ({ default: m.CheckoutFailurePage })))
const CheckoutTransferPage  = lazy(() => import('@/pages/CheckoutTransferPage').then(m => ({ default: m.CheckoutTransferPage })))
const MyOrdersPage          = lazy(() => import('@/pages/MyOrdersPage').then(m => ({ default: m.MyOrdersPage })))
const OrderDetailPage       = lazy(() => import('@/pages/OrderDetailPage').then(m => ({ default: m.OrderDetailPage })))
const VerifyEmailPage       = lazy(() => import('@/pages/VerifyEmailPage').then(m => ({ default: m.VerifyEmailPage })))
const ForgotPasswordPage    = lazy(() => import('@/pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage     = lazy(() => import('@/pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })))

// Shipping
const TrackingPage               = lazy(() => import('@/modules/shipping').then(m => ({ default: m.TrackingPage })))
const ConfirmCancelShipmentPage  = lazy(() => import('@/pages/ConfirmCancelShipmentPage').then(m => ({ default: m.ConfirmCancelShipmentPage })))

// Admin (chunk separado)
const AdminLayout       = lazy(() => import('@/pages/admin/AdminLayout').then(m => ({ default: m.AdminLayout })))
const AdminDashboard    = lazy(() => import('@/pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })))
const AdminProducts     = lazy(() => import('@/pages/admin/AdminProducts').then(m => ({ default: m.AdminProducts })))
const AdminOrders       = lazy(() => import('@/pages/admin/AdminOrders').then(m => ({ default: m.AdminOrders })))
const AdminCalculator   = lazy(() => import('@/pages/admin/AdminCalculator').then(m => ({ default: m.AdminCalculator })))
const AdminSettings     = lazy(() => import('@/pages/admin/AdminSettings').then(m => ({ default: m.AdminSettings })))
const ApproveProductPage = lazy(() => import('@/pages/admin/ApproveProductPage').then(m => ({ default: m.ApproveProductPage })))

// ── Fallback mientras carga ─────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
    </div>
  )
}

function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
      <CartDrawer />
    </>
  )
}

export default function App() {
  const loadUser = useAuthStore((s) => s.loadUser)
  const applyTheme = useThemeStore((s) => s.apply)

  useEffect(() => {
    loadUser()
    applyTheme()
  }, [loadUser, applyTheme])

  return (
    <HelmetProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Auth (sin layout) */}
          <Route path="/auth"                    element={<AuthPage />} />
          <Route path="/auth/verify/:token"      element={<VerifyEmailPage />} />
          <Route path="/auth/forgot-password"    element={<ForgotPasswordPage />} />
          <Route path="/auth/reset/:token"       element={<ResetPasswordPage />} />

          {/* Aprobación de productos (token = auth) */}
          <Route path="/admin/aprobar/:token" element={<ApproveProductPage />} />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute require="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index                    element={<AdminDashboard />} />
            <Route path="productos"         element={<AdminProducts />} />
            <Route path="pedidos"           element={<AdminOrders />} />
            <Route path="calculadora"       element={<AdminCalculator />} />
            <Route path="configuracion"     element={<AdminSettings />} />
          </Route>

          {/* Tienda */}
          <Route
            path="/*"
            element={
              <ShopLayout>
                <Routes>
                  <Route path="/"                    element={<HomePage />} />
                  <Route path="/productos"           element={<ProductsPage />} />
                  <Route path="/productos/:slug"     element={<ProductDetailPage />} />
                  <Route path="/carrito"             element={<CartPage />} />

                  <Route path="/checkout"
                    element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
                  <Route path="/checkout/success"
                    element={<ProtectedRoute><CheckoutSuccessPage /></ProtectedRoute>} />
                  <Route path="/checkout/failure"
                    element={<ProtectedRoute><CheckoutFailurePage /></ProtectedRoute>} />
                  <Route path="/checkout/transferencia/:orderId"
                    element={<ProtectedRoute><CheckoutTransferPage /></ProtectedRoute>} />
                  <Route path="/pedidos"
                    element={<ProtectedRoute><MyOrdersPage /></ProtectedRoute>} />
                  <Route path="/pedidos/:id"
                    element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />

                  <Route path="/seguimiento"                          element={<TrackingPage />} />
                  <Route path="/shipping/cancelar-confirmar/:token"  element={<ConfirmCancelShipmentPage />} />
                </Routes>
              </ShopLayout>
            }
          />
        </Routes>
      </Suspense>
    </HelmetProvider>
  )
}
