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
  const [directory, setDirectory] = useState<"shops" | "products">("shops"); const [query, setQuery] = useState(""); const [status, setStatus] = useState(""); const [page, setPage] = useState(1); const [pages, setPages] = useState(1); const [items, setItems] = useState<any[]>([]); const [detail, setDetail] = useState<any>(); const [loading, setLoading] = useState(true);
  const headers = { headers: { Authorization: `Bearer ${token}` } };
  const load = useCallback(async () => { try { const [pending, dashboard, directoryResponse] = await Promise.all([api.get("/admin/pending", headers), api.get("/admin/dashboard", headers), api.get(`/admin/${directory}?page=${page}&limit=12&search=${encodeURIComponent(query)}&status=${status}`, headers)]); setData(pending.data.data); setMetrics(dashboard.data.data); setItems(directoryResponse.data.data || []); setPages(directoryResponse.data.pagination?.totalPages || 1); } catch (error) { const details = getApiError(error); if (details.code === "ADMIN_FORBIDDEN" || details.code === "ADMIN_AUTH_REQUIRED") onLogout(); else toast.show(details.message, "error"); } finally { setLoading(false); } }, [token, directory, page, query, status]);
  useEffect(() => { setLoading(true); void load(); }, [load]);
  const action = async (path: string, message: string, body = {}) => { try { await api.post(path, body, headers); toast.show(message); setDetail(undefined); await load(); } catch (error) { toast.show(getApiError(error).message, "error"); } };
  const openDetail = async (kind: "shops" | "products", id: string) => { try { const response = await api.get(`/admin/${kind}/${id}`, headers); setDetail(response.data.data); } catch (error) { toast.show(getApiError(error).message, "error"); } };
  return <main className="admin-shell"><aside className="admin-sidebar"><div className="admin-brand">findit<span>surat</span><small>CONTROL CENTER</small></div><nav><a className="active" href="#overview">Overview</a><a href="#shops" onClick={() => { setDirectory("shops"); setPage(1); }}>All shops <b>{metrics.pendingSellers}</b></a><a href="#products" onClick={() => { setDirectory("products"); setPage(1); }}>All products <b>{metrics.pendingProducts}</b></a></nav><button className="admin-logout" onClick={onLogout}>Log out</button></aside><section className="admin-content"><header className="admin-topbar"><div><span className="eyebrow">OPERATIONS / DIRECTORY</span><h1>FindIt review center</h1></div><div className="admin-status"><span></span> System operational</div></header><div className="admin-metrics"><Metric label="Pending shops" value={metrics.pendingSellers} /><Metric label="Pending products" value={metrics.pendingProducts} /><Metric label="Verified shops" value={metrics.verifiedSellers} /><Metric label="Live products" value={metrics.approvedProducts} /></div><section className="admin-section admin-queue" id="overview"><div className="queue-heading"><div><span className="eyebrow">DIRECTORY</span><h2>{directory === "shops" ? "All shops" : "All products"}</h2></div><button className="refresh-button" onClick={() => void load()}>Refresh</button></div><div className="directory-toolbar"><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder={`Search ${directory === "shops" ? "shop, email, mobile or area" : "product, tag or shop"}`} /><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">All statuses</option>{(directory === "shops" ? ["PENDING", "VERIFIED", "REJECTED"] : ["PENDING", "APPROVED", "REJECTED"]).map((value) => <option key={value} value={value}>{value}</option>)}</select></div>{loading ? <div className="admin-state">Loading directory...</div> : <div className="approval-list">{items.map((item) => <article className="approval-row" key={item.id}><div className="approval-avatar">{directory === "shops" ? item.shop_name.charAt(0) : "P"}</div><div className="approval-info"><b>{directory === "shops" ? item.shop_name : item.title}</b><small>{directory === "shops" ? `${item.mobile_number || "No mobile"} · ${item.area || "No area"}` : `${item.shop_name} · Shop ${item.verification_status}`}</small><span className="status">{directory === "shops" ? item.verification_status : item.status}</span></div><span className="approval-actions"><button className="secondary-action compact-button" onClick={() => void openDetail(directory, item.id)}>View details</button>{directory === "shops" && item.verification_status === "PENDING" && <button className="primary compact-button" onClick={() => action(`/admin/sellers/${item.id}/approve`, "Shop approved.")}>Approve shop</button>}{directory === "products" && item.status === "PENDING" && <button className="primary compact-button" onClick={() => action(`/admin/products/${item.id}/approve`, "Product approved.")}>Approve product</button>}</span></article>)}</div>}<div className="pagination"><button disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button><span>Page {page} of {pages}</span><button disabled={page >= pages} onClick={() => setPage((current) => current + 1)}>Next</button></div></section>{detail && <DetailPanel detail={detail} directory={directory} close={() => setDetail(undefined)} action={action} />}</section></main>;
}

function DetailPanel({ detail, directory, close, action }: { detail: any; directory: "shops" | "products"; close: () => void; action: (path: string, message: string, body?: any) => void }) {
  if (directory === "products") return <section className="admin-section detail-panel"><button className="close" onClick={close}>Close</button><span className="eyebrow">PRODUCT DETAIL</span><h2>{detail.product?.title || detail.title}</h2><p>{detail.product?.description || detail.description}</p><div className="preview-grid">{(detail.media || []).map((item: any) => item.resource_type === "video" ? <video key={item.id} src={item.url} controls /> : <img key={item.id} src={item.url} alt="Product media" />)}</div></section>;
  const shop = detail.shop; return <section className="admin-section detail-panel"><button className="close" onClick={close}>Close</button><span className="eyebrow">SHOP DETAIL</span><h2>{shop.shop_name}</h2><p>{shop.email} · {shop.mobile_number}</p><p>{shop.address_line}, {shop.area}, {shop.city}</p><span className="status">{shop.verification_status}</span><div className="preview-grid">{(detail.media || []).map((item: any) => <img key={item.id} src={item.url} alt={`${item.media_type.toLowerCase()} shop media`} />)}</div><h3>Products</h3>{detail.products.map((product: any) => <article className="approval-row" key={product.id}><div><b>{product.title}</b><small>{product.status}</small><div className="preview-grid">{(product.media || []).map((item: any) => item.resource_type === "video" ? <video key={item.id} src={item.url} controls /> : <img key={item.id} src={item.url} alt={product.title} />)}</div></div>{product.status === "PENDING" && shop.verification_status === "VERIFIED" && <button className="secondary-action compact-button" onClick={() => void action(`/admin/products/${product.id}/approve`, "Product approved.")}>Approve</button>}</article>)}</section>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="metric"><strong>{value}</strong><span>{label}</span></div>;
}
