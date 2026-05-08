import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./DashboardLayout.jsx";
import RoleHome from "./RoleHome.jsx";
import Workspaces from "./Workspaces.jsx";
import Workspace from "./Workspace.jsx";
import InstitutionForm from "./InstitutionForm.jsx";
import KycForm from "./KycForm.jsx";
import Skus from "./Skus.jsx";
import SkuDetail from "./SkuDetail.jsx";
import Batches from "./Batches.jsx";
import BatchDetail from "./BatchDetail.jsx";
import AdminOverview from "./admin/AdminOverview.jsx";
import AdminUsers from "./admin/AdminUsers.jsx";
import AdminKyc from "./admin/AdminKyc.jsx";
import AdminSkus from "./admin/AdminSkus.jsx";
import AdminBatches from "./admin/AdminBatches.jsx";
import AdminInstitutions from "./admin/AdminInstitutions.jsx";
import AdminAudit from "./admin/AdminAudit.jsx";
import { ProtectedRoute } from "../../auth/ProtectedRoute.jsx";

export default function DashboardRoutes() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<RoleHome />} />
        <Route path="workspaces" element={<Workspaces />} />
        <Route path="workspaces/:id" element={<Workspace />} />
        <Route
          path="institution"
          element={
            <ProtectedRoute roles={["manufacturer", "government"]}>
              <InstitutionForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="kyc"
          element={
            <ProtectedRoute roles={["manufacturer", "government"]}>
              <KycForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="skus"
          element={
            <ProtectedRoute roles={["manufacturer", "government", "admin"]}>
              <Skus />
            </ProtectedRoute>
          }
        />
        <Route
          path="skus/:id"
          element={
            <ProtectedRoute roles={["manufacturer", "government", "admin"]}>
              <SkuDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="batches"
          element={
            <ProtectedRoute roles={["manufacturer", "government", "admin"]}>
              <Batches />
            </ProtectedRoute>
          }
        />
        <Route
          path="batches/:id"
          element={
            <ProtectedRoute roles={["manufacturer", "government", "admin"]}>
              <BatchDetail />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminOverview />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/users"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/kyc"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminKyc />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/skus"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminSkus />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/batches"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminBatches />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/institutions"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminInstitutions />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/audit"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminAudit />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
