import { Navigate, Route, Routes } from "react-router-dom";
import { SellerRoutes } from "./seller/SellerRoutes";
import { UsersPending } from "./users/UsersPending";
import { AdminPending } from "./admin/AdminPending";
export function App() {
  return (
    <Routes>
      <Route path="/seller/*" element={<SellerRoutes />} />
      <Route path="/users/*" element={<UsersPending />} />
      <Route path="/admin/*" element={<AdminPending />} />
      <Route path="*" element={<Navigate to="/seller/register" replace />} />
    </Routes>
  );
}
