import { useCallback, useEffect, useState } from "react";
import { api, getApiError } from "../seller/api";
import { useForm } from "react-hook-form";
import { useToast } from "../components/Toast";
import "./admin.css";

type PendingData = { sellers: any[]; products: any[] };
type Metrics = { pendingSellers: number; pendingProducts: number; verifiedSellers: number; approvedProducts: number };

export function AdminPending() {
  const [token, setToken] = useState(localStorage.getItem("findit_admin_token"));
  const toast = useToast();
  if (!token) return <AdminLogin onLogin={(value) => { localStorage.setItem("findit_admin_token", value); setToken(value); }} />;
  return <AdminDashboard token={token} onLogout={() => { localStorage.removeItem("findit_admin_token"); setToken(null); }} toast={toast} />;
}

function AdminLogin({ onLogin }: { onLogin: (token: string) => void }) {
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm<{ mobileNumber: string; password: string }>();
  const toast = useToast();
  const submit = async (values: { mobileNumber: string; password: string }) => {
    try { const response = await api.post("/admin/login", values); onLogin(response.data.token); toast.show("Admin login successful."); }
    catch (error) { toast.show(getApiError(error).message, "error"); }
  };
  return <main className="auth-card admin-login"><span className="eyebrow">ADMIN CONSOLE</span><h1>Manage FindIt</h1><p>Approve shops and products before they become public.</p><form onSubmit={handleSubmit(submit)}>
    <label>Admin mobile<input inputMode="numeric" {...register("mobileNumber", { required: true, pattern: /^[6-9]\d{9}$/ })} />{errors.mobileNumber && <small>Enter a valid mobile number.</small>}</label>
    <label>Password<input type="password" {...register("password", { required: true })} />{errors.password && <small>Password is required.</small>}</label>
    <button className="primary" disabled={isSubmitting}>{isSubmitting ? "Signing in..." : "Sign in"}</button>
  </form></main>;
}

function AdminDashboard({ token, onLogout, toast }: { token: string; onLogout: () => void; toast: ReturnType<typeof useToast> }) {
  const [data, setData] = useState<PendingData>({ sellers: [], products: [] });
  const [metrics, setMetrics] = useState<Metrics>({ pendingSellers: 0, pendingProducts: 0, verifiedSellers: 0, approvedProducts: 0 });
  const [loading, setLoading] = useState(true);
  const headers = { headers: { Authorization: `Bearer ${token}` } };
  const load = useCallback(async () => {
    try {
      const [pending, dashboard] = await Promise.all([api.get("/admin/pending", headers), api.get("/admin/dashboard", headers)]);
      setData(pending.data.data); setMetrics(dashboard.data.data);
    } catch (error) {
      const details = getApiError(error);
      if (details.code === "ADMIN_FORBIDDEN" || details.code === "ADMIN_AUTH_REQUIRED") onLogout();
      toast.show(details.message, "error");
    } finally { setLoading(false); }
  }, [token]);
  useEffect(() => { void load(); }, [load]);
  const action = async (path: string, message: string, body = {}) => {
    try { await api.post(path, body, headers); toast.show(message); await load(); }
    catch (error) { toast.show(getApiError(error).message, "error"); }
  };
  return <main className="pending admin-page"><div className="page-heading"><div><span className="eyebrow">ADMIN CONSOLE</span><h1>FindIt operations</h1><p>Review shops and catalogue items, then publish or reject them.</p></div><button onClick={onLogout}>Log out</button></div>
    <div className="metric-grid"><Metric label="Pending shops" value={metrics.pendingSellers} /><Metric label="Pending products" value={metrics.pendingProducts} /><Metric label="Verified shops" value={metrics.verifiedSellers} /><Metric label="Live products" value={metrics.approvedProducts} /></div>
    {loading ? <p>Loading approvals...</p> : <><section className="admin-section"><h2>Shops waiting for review</h2>{!data.sellers.length ? <p>No shops are waiting for approval.</p> : data.sellers.map((seller) => <article className="approval-row" key={seller.id}><div><b>{seller.shop_name}</b><small>{seller.mobile_number || "No mobile number"}</small></div><span><button className="primary compact-button" onClick={() => action(`/admin/sellers/${seller.id}/approve`, "Shop approved.")}>Approve</button>{" "}<button className="danger-button compact-button" onClick={() => action(`/admin/sellers/${seller.id}/reject`, "Shop rejected.")}>Reject</button></span></article>)}</section>
    <section className="admin-section"><h2>Products waiting for review</h2>{!data.products.length ? <p>No products are waiting for approval.</p> : data.products.map((product) => <article className="approval-row" key={product.id}><div><b>{product.title}</b><small>{product.shop_name}</small></div><span><button className="primary compact-button" onClick={() => action(`/admin/products/${product.id}/approve`, "Product approved.")}>Approve</button>{" "}<button className="danger-button compact-button" onClick={() => action(`/admin/products/${product.id}/reject`, "Product rejected.", { reason: "Rejected by administrator" })}>Reject</button></span></article>)}</section></>}
  </main>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="metric"><strong>{value}</strong><span>{label}</span></div>;
}
