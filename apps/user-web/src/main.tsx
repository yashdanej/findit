import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { createRoot } from "react-dom/client";
import axios from "axios";
import "./style.css";
 const apiBase =
        (import.meta as ImportMeta & { env?: { VITE_API_URL?: string } }).env
          ?.VITE_API_URL || "http://localhost:5000/api/v1";
type Product = {
  id: string | number;
  title: string;
  shop: string;
  area: string;
  price: string;
  rating: string;
  image: string;
  tag?: string;
  description: string;
  tags?: string;
  sellerId: string | number;
  sellerPhone?: string;
  sellerAddress?: string;
  locationUrl?: string;
  originalPrice?: number;
  sellingPrice?: number;
  discountPercent?: number;
  sellerMedia?: any[];
};
type VisualMatch = {
  id: string;
  title: string;
  description: string;
  shop_name: string;
  seller_id?: string;
  mobile_number?: string;
  area: string;
  address_line?: string;
  image_url?: string;
  base_price?: number;
  selling_price?: number;
  similarity: number;
  matchType?: string;
};

const products: Product[] = [
  {
    id: 1,
    title: "Dola Silk Zari Saree",
    shop: "Rajhans Textiles",
    area: "Ring Road",
    price: "₹1,850 onwards",
    rating: "4.8",
    image:
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=85",
    tag: "Trending",
    sellerId: 1,
    description:
      "A rich Dola silk saree with traditional zari detailing, perfect for festive occasions and family celebrations.",
  },
  {
    id: 2,
    title: "Organza Floral Edit",
    shop: "Mahalaxmi Sarees",
    area: "Sahara Darwaja",
    price: "₹2,400 onwards",
    rating: "4.7",
    image:
      "https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=900&q=85",
    sellerId: 2,
    description:
      "Lightweight organza with an all-over floral edit. Ask the shop about available colours and matching blouse pieces.",
  },
  {
    id: 3,
    title: "Mirror Work Festive Set",
    shop: "Kesar Fashion Hub",
    area: "Vesu",
    price: "₹1,299 onwards",
    rating: "4.9",
    image:
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=900&q=85",
    tag: "New in",
    sellerId: 3,
    description:
      "A festive-ready mirror work set with a contemporary silhouette and comfortable finish.",
  },
  {
    id: 4,
    title: "Pure Linen Co-ord",
    shop: "The Fabric House",
    area: "Adajan",
    price: "₹980 onwards",
    rating: "4.6",
    image:
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=85",
    sellerId: 4,
    description:
      "Breathable pure linen co-ord set for everyday dressing, available in soft seasonal shades.",
  },
  {
    id: 5,
    title: "Banarasi Tissue Saree",
    shop: "Shree Laxmi Silks",
    area: "Salabatpura",
    price: "₹3,200 onwards",
    rating: "4.8",
    image:
      "https://images.unsplash.com/photo-1605763240000-7e93b172d754?auto=format&fit=crop&w=900&q=85",
    sellerId: 5,
    description:
      "A luminous Banarasi tissue weave with a timeless finish for weddings and special occasions.",
  },
  {
    id: 6,
    title: "Cotton Printed Kurti",
    shop: "Aastha Wholesale",
    area: "Varachha",
    price: "₹450 onwards",
    rating: "4.5",
    image:
      "https://images.unsplash.com/photo-1585488439289-7e9f7c4b3a83?auto=format&fit=crop&w=900&q=85",
    sellerId: 6,
    description:
      "Easy cotton printed kurtis for daily wear, with wholesale availability for resellers.",
  },
];

const sellers = [
  {
    id: 1,
    name: "Rajhans Textiles",
    area: "Ring Road L",
    address: "Shop 14, Textile Market, Ring Road, Surat",
    phone: "+91 98765 43210",
    hours: "10:00 AM – 8:30 PM",
    rating: "4.8",
    reviews: "128",
    lat: 21.1938,
    lng: 72.8314,
  },
  {
    id: 2,
    name: "Mahalaxmi Sarees",
    area: "Sahara Darwaja",
    address: "Building B, Sahara Darwaja Market, Surat",
    phone: "+91 98250 11223",
    hours: "10:30 AM – 8:00 PM",
    rating: "4.7",
    reviews: "96",
    lat: 21.1852,
    lng: 72.8385,
  },
  {
    id: 3,
    name: "Kesar Fashion Hub",
    area: "Vesu",
    address: "Galaxy Circle, Vesu, Surat",
    phone: "+91 98980 77123",
    hours: "11:00 AM – 9:00 PM",
    rating: "4.9",
    reviews: "74",
    lat: 21.1448,
    lng: 72.7702,
  },
  {
    id: 4,
    name: "The Fabric House",
    area: "Adajan",
    address: "Opp. LP Savani Road, Adajan, Surat",
    phone: "+91 99040 22110",
    hours: "10:00 AM – 8:00 PM",
    rating: "4.6",
    reviews: "54",
    lat: 21.2114,
    lng: 72.7932,
  },
  {
    id: 5,
    name: "Shree Laxmi Silks",
    area: "Salabatpura",
    address: "Silk Plaza, Salabatpura, Surat",
    phone: "+91 98123 55519",
    hours: "10:00 AM – 8:30 PM",
    rating: "4.8",
    reviews: "113",
    lat: 21.1991,
    lng: 72.8373,
  },
  {
    id: 6,
    name: "Aastha Wholesale",
    area: "Varachha",
    address: "Sarthana Jakat Naka, Varachha, Surat",
    phone: "+91 98241 84620",
    hours: "9:30 AM – 8:00 PM",
    rating: "4.5",
    reviews: "42",
    lat: 21.2187,
    lng: 72.8642,
  },
];

function Icon({ children }: { children: string }) {
  return (
    <span className="icon" aria-hidden="true">
      {children}
    </span>
  );
}
function go(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
function ProductPricing({ product }: { product: Product }) {
  const original = Number(product.originalPrice || 0);
  const selling = Number(product.sellingPrice || original);
  if (!original) return <b>{product.price}</b>;
  return (
    <span className="product-pricing">
      <strong>
        ₹{selling.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
      </strong>
      {product.discountPercent ? (
        <>
          <del>
            ₹{original.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
          </del>
          <em>{product.discountPercent}% OFF</em>
        </>
      ) : null}
    </span>
  );
}

function Reviews({ apiBase, kind, id }: { apiBase: string; kind: "products" | "shops"; id: string | number }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);
  const [saving, setSaving] = useState(false);
  const load = () => axios.get(`${apiBase}/public/${kind}/${id}/reviews`).then(({ data }) => setReviews(data.data || [])).catch((e) => setError(e.response?.data?.message || "Reviews could not be loaded.")).finally(() => setLoading(false));
  useEffect(() => { void load(); }, [apiBase, kind, id]);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError("");
    try { await axios.post(`${apiBase}/public/${kind}/${id}/reviews`, { name: name.trim(), rating, comment: comment.trim() }); setName(""); setComment(""); await load(); }
    catch (e: any) { setError(e.response?.data?.message || "Review could not be submitted."); }
    finally { setSaving(false); }
  };
  return <section className="reviews-section"><div className="section-heading"><div><span className="eyebrow">COMMUNITY REVIEWS</span><h2>What visitors say</h2></div></div>{loading ? <div className="catalog-status">Loading reviews...</div> : reviews.length ? <div className="review-list">{reviews.map((review) => <article className="review-card" key={`${review.created_at}-${review.reviewer_name}`}><b>{review.reviewer_name}</b><span>★ {review.rating}/5</span><p>{review.comment}</p></article>)}</div> : <p className="offline-note">No reviews yet. Be the first to share your experience.</p>}<form className="review-form" onSubmit={submit}><input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required /><select value={rating} onChange={(e) => setRating(Number(e.target.value))}>{[5,4,3,2,1].map((value) => <option key={value} value={value}>{value} stars</option>)}</select><textarea placeholder="Share your experience" value={comment} onChange={(e) => setComment(e.target.value)} required /><button className="primary-action" disabled={saving}>{saving ? "Submitting..." : "Add review"}</button>{error && <p className="auth-error">{error}</p>}</form></section>;
}

function Header({
  openSearch,
  home,
}: {
  openSearch: () => void;
  home: () => void;
}) {
  const authenticated = Boolean(localStorage.getItem("findit_user_token"));
  const protectedRoute = (path: string) => go(authenticated ? path : "/login");
  const logout = () => {
    localStorage.removeItem("findit_user_token");
    localStorage.removeItem("findit_saved");
    go("/");
  };
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <button className="brand" onClick={home} aria-label="FindIt Surat home">
          <span className="brand-mark">F</span>
          <span>
            findit<span className="brand-accent">surat</span>
          </span>
        </button>
        <div className="location">
          <Icon>⌖</Icon>
          <span>Surat</span>
          <Icon>⌄</Icon>
        </div>
        <div className="header-actions">
          <button aria-label="Search" onClick={openSearch}>
            <Icon>⌕</Icon>
          </button>
          <button aria-label="Favourites" onClick={() => protectedRoute("/saved")}>
            <Icon>♡</Icon>
          </button>
        </div>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <button onClick={home}>Home</button>
          <button onClick={() => protectedRoute("/saved")}>Favourites</button>
          <button onClick={() => protectedRoute("/coupons")}>My coupons</button>
          {authenticated ? (
            <>
              <button onClick={() => protectedRoute("/account")}>Profile</button>
              <button className="nav-logout" onClick={logout}>Log out</button>
            </>
          ) : (
            <>
              <button onClick={() => go("/login")}>Log in</button>
              <button className="nav-register" onClick={() => go("/register")}>Register</button>
            </>
          )}
        </nav>
      </div>
      <div className="mobile-search" onClick={openSearch}>
        <Icon>⌕</Icon>
        <span>Search sarees, fabrics, shops...</span>
        <b>⌘</b>
      </div>
      <MobileNavigation />
    </header>
  );
}

function MobileNavigation() {
  const path = window.location.pathname;
  const authenticated = Boolean(localStorage.getItem("findit_user_token"));
  const protectedRoute = (destination: string) => go(authenticated ? destination : "/login");
  return <nav className="bottom-nav" aria-label="Mobile navigation">
    <button className={path === "/" ? "nav-item active" : "nav-item"} onClick={() => go("/")}><Icon>⌂</Icon><span>Home</span></button>
    <button className="nav-item" onClick={() => document.querySelector<HTMLInputElement>(".market-search-input input")?.focus()}><Icon>⌕</Icon><span>Search</span></button>
    <button className={path === "/saved" ? "nav-item active" : "nav-item"} onClick={() => protectedRoute("/saved")}><Icon>♡</Icon><span>Favourites</span></button>
    <button className={path === "/coupons" ? "nav-item active" : "nav-item"} onClick={() => protectedRoute("/coupons")}><Icon>♧</Icon><span>Coupons</span></button>
    <button className={path === "/account" ? "nav-item active" : "nav-item"} onClick={() => protectedRoute("/account")}><Icon>♙</Icon><span>Profile</span></button>
  </nav>;
}

function ProductCard({
  product,
  saved,
  toggleSaved,
  onCoupon,
  coupon,
}: {
  product: Product;
  saved: Array<string | number>;
  toggleSaved: (id: string | number) => void;
  onCoupon?: (id: string) => void;
  coupon?: { code: string; status: string };
}) {
  const liked = saved.some((id) => String(id) === String(product.id));
  return (
    <article className="product-card">
      <button
        className="product-image"
        onClick={() => go(`/product/${product.id}`)}
      >
        <img src={product.image} alt={product.title} loading="lazy" />
        {product.tag && <span className="product-tag">{product.tag}</span>}
        <span
          role="button"
          tabIndex={0}
          aria-label={liked ? "Remove from favorites" : "Add to favorites"}
          className={liked ? "save saved" : "save"}
          onClick={(event) => {
            event.stopPropagation();
            toggleSaved(product.id);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.stopPropagation();
              toggleSaved(product.id);
            }
          }}
        >
          {liked ? "♥" : "♡"}
        </span>
      </button>
      <div className="product-info">
        <button
          className="product-title"
          onClick={() => go(`/product/${product.id}`)}
        >
          {product.title}
        </button>
        <button
          className="shop-name"
          onClick={() => go(`/shop/${product.sellerId}`)}
        >
          {product.shop}
        </button>
        <p className="location-line">
          <Icon>⌖</Icon> {product.area}{" "}
          <span className="rating">★ {product.rating}</span>
        </p>
        <div className="product-bottom">
          <ProductPricing product={product} />
          <button onClick={() => go(`/product/${product.id}`)}>
            View details <span>↗</span>
          </button>
        </div>
        {coupon?.status === "CLAIMED" ? (
          <div className="coupon-result product-coupon-state">
            <b>Coupon claimed: {coupon.code}</b>
            <span>Claimed - Not Purchased</span>
          </div>
        ) : onCoupon ? (
          <button
            className="claim-product-coupon"
            onClick={() => onCoupon(String(product.id))}
          >
            Claim 10% coupon
          </button>
        ) : null}
      </div>
    </article>
  );
}

function VisualMatchCard({
  match,
}: {
  match: VisualMatch;
  onCoupon?: (id: string) => void;
}) {
  const confidence =
    match.matchType === "STRONG_MATCH"
      ? "Strong match"
      : match.matchType === "SIMILAR_MATCH"
        ? "Similar match"
        : "Closest match";
  return (
    <article className="visual-result-card">
      <img
        src={match.image_url || ""}
        alt={match.title}
        loading="lazy"
      />
      <div className="visual-result-copy">
        <b>{match.title}</b>
        <span>
          {match.shop_name} · {match.area}
        </span>
        <span>{match.address_line || "Surat"}</span>
        <small>
          {confidence} · {Math.round(match.similarity * 100)}% visual match
        </small>
        <strong>
          {match.base_price
            ? `₹${Number(match.selling_price || match.base_price).toLocaleString("en-IN")}`
            : "Ask shop for price"}
        </strong>
      </div>
      <button onClick={() => go(`/product/${match.id}`)}>View product</button>
    </article>
  );
}

function mapProductRow(row: any): Product {
  return {
    id: row.id,
    title: row.title,
    shop: row.shop_name,
    area: row.area || "Surat",
    price: row.base_price
      ? `₹${Number(row.selling_price || row.base_price).toLocaleString("en-IN")}`
      : "Ask shop for price",
    rating: "New",
    image: row.image_url || "",
    description: row.description,
    tags: Array.isArray(row.tags) ? row.tags.join(" ") : String(row.tags || ""),
    sellerId: row.seller_id,
    sellerPhone: row.mobile_number,
    sellerAddress: row.address_line,
    locationUrl: row.location_url,
    originalPrice: Number(row.base_price || 0),
    sellingPrice: Number(row.selling_price || row.base_price || 0),
    discountPercent: Number(row.discount_percent || 0),
    sellerMedia: row.sellerMedia,
  };
}

function Home({
  catalog,
  search,
  setSearch,
  saved,
  toggleSaved,
  openImage,
  onCoupon,
  coupons,
  showSaved = false,
}: {
  catalog: Product[];
  search: string;
  setSearch: (value: string) => void;
  saved: Array<string | number>;
  toggleSaved: (id: string | number) => void;
  openImage: () => void;
  onCoupon?: (id: string) => void;
  coupons?: Record<string, { code: string; status: string }>;
  showSaved?: boolean;
}) {
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("popular");
  const [shortlist, setShortlist] = useState(showSaved);
  const [path, setPath] = useState(window.location.pathname);
  const categories = [
    "All",
    "Sarees",
    "Dupattas",
    "Silk",
    "Blouses",
  ];
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = catalog.filter((product) => {
      const matchesSearch =
        !term ||
        `${product.title} ${product.shop} ${product.area} ${product.description} ${product.tags || ""}`
          .toLowerCase()
          .includes(term);
      const matchesCategory =
        category === "All" ||
        `${product.title} ${product.description}`
          .toLowerCase()
          .includes(category.slice(0, -1).toLowerCase());
      const matchesSaved =
        !(shortlist || window.location.pathname === "/saved") ||
        saved.includes(product.id);
      return matchesSearch && matchesCategory && matchesSaved;
    });
    return [...filtered].sort((a, b) =>
      sort === "newest"
        ? String(b.id).localeCompare(String(a.id))
        : sort === "price"
          ? Number(a.price.replace(/\D/g, "")) -
            Number(b.price.replace(/\D/g, ""))
          : 0,
    );
  }, [catalog, search, category, sort, saved, shortlist]);
  return (
    <main className="market-page">
      <section className="market-heading">
        <div>
          <span className="eyebrow">TRENDING NOW</span>
          <h1>{showSaved ? "Your shortlist" : "Udhna Market Hub"}</h1>
        </div>
        <span>{visible.length} listings</span>
      </section>
      <div className="market-search">
        <div className="market-search-input">
          <Icon>⌕</Icon>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by fabric or shop name..."
          />
        </div>
        <div className="search-modes">
          <button className="mode active" onClick={openImage}>
            <Icon>▧</Icon> Image search
          </button>
          <button
            className="mode"
            onClick={() =>
              document
                .querySelector<HTMLInputElement>(".market-search-input input")
                ?.focus()
            }
          >
            <Icon>⌕</Icon> Keywords
          </button>
        </div>
      </div>
      <div className="category-chips">
        {categories.map((item) => (
          <button
            key={item}
            className={
              category === item ? "category-chip active" : "category-chip"
            }
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="market-filters">
        <button
          className={sort === "popular" ? "filter active" : "filter"}
          onClick={() => setSort("popular")}
        >
          Popular
        </button>
        <button
          className={sort === "newest" ? "filter active" : "filter"}
          onClick={() => setSort("newest")}
        >
          Newest
        </button>
        <button
          className={sort === "price" ? "filter active" : "filter"}
          onClick={() => setSort("price")}
        >
          Price ↑
        </button>
      </div>
      {visible.length ? (
        <div className="product-grid">
          {visible.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              saved={saved}
              toggleSaved={toggleSaved}
              onCoupon={onCoupon}
              coupon={coupons?.[String(product.id)]}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span>♡</span>
          <h3>{showSaved ? "Your shortlist is empty" : "Nothing found yet"}</h3>
          <p>Try another search or browse all market styles.</p>
        </div>
      )}
    </main>
  );
}

function LegacyHome({
  catalog,
  search,
  setSearch,
  saved,
  toggleSaved,
  openImage,
}: {
  catalog: Product[];
  search: string;
  setSearch: (value: string) => void;
  saved: Array<string | number>;
  toggleSaved: (id: string | number) => void;
  openImage: () => void;
}) {
  const visibleProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return catalog.filter(
      (product) =>
        !term ||
        `${product.title} ${product.shop} ${product.area}`
          .toLowerCase()
          .includes(term),
    );
  }, [catalog, search]);
  return (
    <main className="page-container">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">SURAT'S LOCAL STYLE GUIDE</span>
          <h1>
            Find your
            <br />
            <em>next favourite.</em>
          </h1>
          <p>
            Discover beautiful products from trusted Surat shops, all in one
            place.
          </p>
          <button
            className="hero-button"
            onClick={() =>
              document
                .getElementById("trending")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Explore styles <span>→</span>
          </button>
        </div>
        <div className="hero-art">
          <div className="sun"></div>
          <div className="hero-note"><span>Live products from verified Surat shops</span></div>
          <div className="hero-note">
            <b>Just spotted</b>
            <span>Festive edits in Surat</span>
          </div>
        </div>
      </section>
      <section className="quick-find">
        <div>
          <span className="eyebrow">LOOKING FOR SOMETHING SPECIFIC?</span>
          <h2>Let’s find it.</h2>
        </div>
        <button onClick={openImage}>
          <span className="camera">▧</span>
          <span>
            <b>Search by image</b>
            <small>Upload a design you love</small>
          </span>
          <span className="arrow">→</span>
        </button>
      </section>
      <section id="trending" className="product-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">CURATED FOR YOU</span>
            <h2>Trending near you</h2>
          </div>
          <span className="result-count">{visibleProducts.length} styles</span>
        </div>
        <div className="filter-row">
          <button className="filter active">Popular</button>
          <button className="filter">Newest</button>
          <button className="filter">Price ⬍</button>
          <button className="filter last">
            Filter <Icon>☷</Icon>
          </button>
        </div>
        <div className="product-grid">
          {visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              saved={saved}
              toggleSaved={toggleSaved}
            />
          ))}
        </div>
        {visibleProducts.length === 0 && (
          <div className="empty-state">
            <span>⌕</span>
            <h3>Nothing found yet</h3>
            <p>Try a different search or browse all styles.</p>
          </div>
        )}
      </section>
      <section className="trust-banner">
        <div className="trust-icon">✓</div>
        <div>
          <b>Shop with confidence</b>
          <p>Every shop on FindIt is checked by our local team.</p>
        </div>
        <span>›</span>
      </section>
    </main>
  );
}

function PublicShop({ shopId, apiBase, saved, toggleSaved }: { shopId: string; apiBase: string; saved: Array<string | number>; toggleSaved: (id: string | number) => void }) {
  const [data, setData] = useState<any>();
  const [error, setError] = useState("");
  useEffect(() => {
    axios
      .get(`${apiBase}/public/shops/${shopId}`)
      .then((response) => setData(response.data.data))
      .catch((requestError) =>
        setError(
          requestError.response?.data?.message || "Shop could not be loaded.",
        ),
      );
  }, [apiBase, shopId]);
  if (error)
    return (
      <main className="page-container empty-state">
        <h3>{error}</h3>
      </main>
    );
  if (!data)
    return (
      <main className="page-container empty-state">
        <h3>Loading shop...</h3>
      </main>
    );
  const shop = data.shop;
  const banner = data.shopMedia?.find(
    (item: any) => item.media_type === "BANNER",
  );
  const profile = data.shopMedia?.find(
    (item: any) => item.media_type === "PROFILE",
  );
  return (
    <main className="page-container detail-page">
      <button className="back-button" onClick={() => go("/")}>
        ← Back to market
      </button>
      {banner && <img className="shop-banner" src={banner.url} alt={`${shop.shop_name} banner`} />}
      <section className="shop-heading">
        <div className="shop-avatar">
          {profile ? <img src={profile.url} alt={shop.shop_name} /> : shop.shop_name.charAt(0)}
        </div>
        <div>
          <span className="eyebrow">VERIFIED SURAT SHOP</span>
          <h1>{shop.shop_name}</h1>
          <p>
            <Icon>⌖</Icon> {shop.area}, {shop.city}
          </p>
          <p>{shop.address_line}</p>
        </div>
      </section>
      <div className="shop-actions">
        <a className="primary-action" href={`tel:${shop.mobile_number}`}>
          Call shop
        </a>
        <a
          className="secondary-action"
          href={`https://wa.me/${String(shop.mobile_number || "").replace(/\D/g, "")}`}
        >
          WhatsApp
        </a>
        {shop.location_url && (
          <a
            className="secondary-action"
            target="_blank"
            rel="noreferrer"
            href={shop.location_url}
          >
            Open location
          </a>
        )}
      </div>
      <section className="shop-products">
        <div className="section-heading">
          <div>
            <span className="eyebrow">FROM THIS SHOP</span>
            <h2>Available products</h2>
          </div>
        </div>
        <div className="product-grid">
          {data.products.map((item: any) => (
            <ProductCard
              key={item.id}
              product={mapProductRow({
                ...item,
                seller_id: shop.id,
                shop_name: shop.shop_name,
                mobile_number: shop.mobile_number,
                area: shop.area,
                address_line: shop.address_line,
                location_url: shop.location_url,
              })}
              saved={saved}
              toggleSaved={toggleSaved}
            />
          ))}
        </div>
      </section>
      <Reviews apiBase={apiBase} kind="shops" id={shop.id} />
    </main>
  );
}

function ProductDetail({ product, claim, apiBase, existingCoupon }: { product: Product; claim: (id: string) => Promise<string | undefined>; apiBase: string; existingCoupon?: { code: string; status: string } }) {
  const [coupon, setCoupon] = useState(existingCoupon?.code || "");
  const [claiming, setClaiming] = useState(false);
  const seller = {
    id: product.sellerId,
    name: product.shop,
    area: product.area,
    address: product.sellerAddress || `${product.area}, Surat`,
    phone: product.sellerPhone || "",
  };
  const claimProduct = async () => {
    setClaiming(true);
    const code = await claim(String(product.id));
    if (code) setCoupon(code);
    setClaiming(false);
  };
  return (
    <main className="page-container detail-page">
      <button className="back-button" onClick={() => go("/")}>
        ← Back to discovery
      </button>
      {product.sellerMedia?.find((item: any) => item.media_type === "BANNER") && <img className="shop-banner" src={product.sellerMedia.find((item: any) => item.media_type === "BANNER").url} alt={`${seller.name} banner`} />}
      <div className="detail-grid">
        <div className="detail-photo">
          <img src={product.image} alt={product.title} />
        </div>
        <div className="detail-copy">
          <div className="seller-inline"><div className="shop-avatar">{product.sellerMedia?.find((item: any) => item.media_type === "PROFILE") ? <img src={product.sellerMedia.find((item: any) => item.media_type === "PROFILE").url} alt={seller.name} /> : seller.name.charAt(0)}</div><button className="detail-shop" onClick={() => go(`/shop/${seller.id}`)}>{seller.name} <span>↗</span></button></div>
          <span className="eyebrow">{product.tag || "SURAT EDIT"}</span>
          <h1>{product.title}</h1>
          <p className="detail-shop" onClick={() => go(`/shop/${seller.id}`)}>
            {seller.name} <span>↗</span>
          </p>
          <div className="detail-rating">
            ★ {product.rating} <span>Verified product</span>
          </div>
          <p className="detail-description">{product.description}</p>
          <div className="price-box">
            <small>Price</small>
            <ProductPricing product={product} />
            <span>Final price may vary by colour, fabric and quantity.</span>
          </div>
          <div className="detail-actions">
            <a href={`tel:${seller.phone}`} className="primary-action">
              Call shop
            </a>
            <a
              href={`https://wa.me/${seller.phone.replace(/\D/g, "")}`}
              className="secondary-action"
            >
              WhatsApp
            </a>
            {product.locationUrl && (
              <a
                href={product.locationUrl}
                target="_blank"
                rel="noreferrer"
                className="secondary-action"
              >
                Open location
              </a>
            )}
          </div>
          {existingCoupon?.status === "CLAIMED" || coupon ? (
            <div className="coupon-result">
              <b>Coupon claimed: {coupon}</b>
              <span>Claimed - Not Purchased. Show this code to the seller at checkout for 10% off.</span>
            </div>
          ) : (
            <button
              className="claim-product-coupon"
              onClick={() => void claimProduct()}
              disabled={claiming}
            >
              {claiming ? "Claiming..." : "Claim 10% coupon"}
            </button>
          )}
          <p className="offline-note">
            Find it online. Buy it offline. Visit the shop to check stock and
            negotiate the best price.
          </p>
        </div>
      </div>
      <section className="shop-preview">
        <div>
          <span className="eyebrow">AVAILABLE AT</span>
          <h2>{seller.name}</h2>
          <p>
            <Icon>⌖</Icon> {seller.address}
          </p>
        </div>
        <button onClick={() => go(`/shop/${seller.id}`)}>
          View shop <span>→</span>
        </button>
      </section>
      <Reviews apiBase={apiBase} kind="products" id={product.id} />
    </main>
  );
}

function ShopDetail({ seller }: { seller: (typeof sellers)[number] }) {
  const shopProducts = products.filter(
    (product) => product.sellerId === seller.id,
  );
  return (
    <main className="page-container detail-page">
      <button className="back-button" onClick={() => go("/")}>
        ← Back to discovery
      </button>
      <section className="shop-heading">
        <div className="shop-avatar">{seller.name.charAt(0)}</div>
        <div>
          <span className="eyebrow">VERIFIED SURAT SHOP</span>
          <h1>{seller.name}</h1>
          <p>
            <Icon>⌖</Icon> {seller.area}{" "}
            <span className="rating">
              ★ {seller.rating} ({seller.reviews} reviews)
            </span>
          </p>
        </div>
        <button className="save-shop">♡ Save shop</button>
      </section>
      <div className="shop-actions">
        <a href={`tel:${seller.phone}`} className="primary-action">
          ☎ Call shop
        </a>
        <a
          href={`https://wa.me/${seller.phone.replace(/\D/g, "")}`}
          className="secondary-action"
        >
          WhatsApp
        </a>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${seller.lat},${seller.lng}`}
          target="_blank"
          rel="noreferrer"
          className="secondary-action"
        >
          Get directions ↗
        </a>
      </div>
      <section className="shop-layout">
        <div>
          <div className="map-card">
            <div className="map-grid"></div>
            <div className="map-road road-one"></div>
            <div className="map-road road-two"></div>
            <div className="map-pin">⌖</div>
            <div className="map-label">{seller.area}, Surat</div>
          </div>
          <div className="address-card">
            <b>Shop location</b>
            <p>
              <Icon>⌖</Icon> {seller.address}
            </p>
            <p className="shop-hours">
              <Icon>◷</Icon> Open today · {seller.hours}
            </p>
          </div>
        </div>
        <aside className="shop-about">
          <span className="eyebrow">ABOUT THIS SHOP</span>
          <h2>Your local textile stop</h2>
          <p>
            Browse in person, compare fabrics and get the right price directly
            from this verified Surat seller.
          </p>
          <div className="shop-stat">
            <b>{seller.rating}</b>
            <span>Average rating</span>
          </div>
          <div className="shop-stat">
            <b>{seller.reviews}</b>
            <span>Local reviews</span>
          </div>
        </aside>
      </section>
      <section className="shop-products">
        <div className="section-heading">
          <div>
            <span className="eyebrow">FROM THIS SHOP</span>
            <h2>Available products</h2>
          </div>
        </div>
        <div className="product-grid">
          {shopProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              saved={[]}
              toggleSaved={() => undefined}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

function UserAuth({ login = false }: { login?: boolean }) {
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
     
      const response = await axios.post(
        `${apiBase}/user/auth/${login ? "login" : "register"}`,
        { email: email || undefined, mobileNumber: mobileNumber || undefined, password, fullName: login ? undefined : fullName },
      );
      localStorage.setItem("findit_user_token", response.data.token);
      go("/");
    } catch (requestError: any) {
      setError(
        requestError.response?.data?.message ||
          "Unable to continue. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="auth-page">
      <div className="auth-box">
        <button className="brand" onClick={() => go("/")}>
          <span className="brand-mark">F</span>
          <span>
            findit<span className="brand-accent">surat</span>
          </span>
        </button>
        <span className="eyebrow">YOUR SURAT STYLE GUIDE</span>
        <h1>{login ? "Welcome back." : "Make your discovery personal."}</h1>
        <p>
          {login
            ? "Save products, collect shop visits and keep your favourites close."
            : "Create an account to save products and generate your 10% FindIt visit coupon."}
        </p>
        <form onSubmit={submit}>
          {!login && (
            <label>
              Your name
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
              />
            </label>
          )}
          <label>
            Email address <span>optional if using mobile</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Mobile number <span>optional if using email</span>
            <input
              inputMode="numeric"
              maxLength={10}
              value={mobileNumber}
              onChange={(event) => setMobileNumber(event.target.value.replace(/\D/g, "").slice(0, 10))}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error && <p className="auth-error">{error}</p>}
          <button className="hero-button" disabled={busy}>
            {busy ? "Please wait..." : login ? "Log in" : "Create account"}{" "}
            <span>→</span>
          </button>
        </form>
        <p className="auth-switch">
          {login ? "New to FindIt? " : "Already have an account? "}
          <button onClick={() => go(login ? "/register" : "/login")}>
            {login ? "Create account" : "Log in"}
          </button>
        </p>
      </div>
    </main>
  );
}

function ProfilePage({ apiBase }: { apiBase: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem("findit_user_token");
    if (!token) {
      go("/login");
      return;
    }
    axios
      .get(`${apiBase}/user/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(({ data }) => {
        setName(data.data.full_name || "");
        setPhone(data.data.mobile_number || "");
        setEmail(data.data.email || "");
      })
      .catch(() =>
        setError("Your profile could not be loaded. Please sign in again."),
      );
  }, [apiBase]);
  const save = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (name.trim().length < 2) {
      setError("Name must contain at least 2 characters.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone.replace(/\D/g, ""))) {
      setError("Enter a valid 10 digit Indian mobile number.");
      return;
    }
    setBusy(true);
    try {
      const token = localStorage.getItem("findit_user_token");
      await axios.patch(
        `${apiBase}/user/me`,
        { fullName: name, mobileNumber: phone },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMessage("Profile details saved.");
    } catch (requestError: any) {
      setError(
        requestError.response?.data?.errors?.mobileNumber ||
          requestError.response?.data?.message ||
          "Profile details could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="auth-page">
      <div className="auth-box">
        <button className="back-button" onClick={() => go("/")}>
          ← Back to discovery
        </button>
        <span className="eyebrow">YOUR PROFILE</span>
        <h1>Keep your details current.</h1>
        <p>Use your saved profile when you return to FindIt.</p>
        <form onSubmit={save}>
          <label>
            Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label>
            Email address
            <input value={email} readOnly />
          </label>
          <label>
            Mobile number
            <input
              inputMode="numeric"
              maxLength={10}
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))
              }
            />
          </label>
          {error && <p className="auth-error">{error}</p>}
          {message && <p className="profile-success">{message}</p>}
          <button className="hero-button" disabled={busy}>
            {busy ? "Saving..." : "Save profile"}
          </button>
        </form>
        <button
          className="secondary-action"
          onClick={() => {
            localStorage.removeItem("findit_user_token");
            go("/login");
          }}
        >
          Log out
        </button>
      </div>
    </main>
  );
}

function CouponsPage({ apiBase }: { apiBase: string }) {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem("findit_user_token");
    if (!token) {
      go("/login");
      return;
    }
    axios.get(`${apiBase}/user/coupons`, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => setCoupons(data.data || []))
      .catch((requestError) => {
        if (requestError.response?.status === 401) {
          localStorage.removeItem("findit_user_token");
          go("/login");
        }
        setError(requestError.response?.data?.message || "Coupon history could not be loaded.");
      })
      .finally(() => setLoading(false));
  }, [apiBase]);
  const visible = coupons.filter((coupon) => filter === "ALL" || coupon.status === filter);
  return <main className="page-container detail-page coupon-page">
    <section className="market-heading"><div><span className="eyebrow">YOUR SAVINGS</span><h1>My coupons</h1></div></section>
    <div className="filter-row">
      {["ALL", "CLAIMED", "VERIFIED", "REDEEMED", "CANCELLED"].map((value) => <button key={value} className={filter === value ? "filter active" : "filter"} onClick={() => setFilter(value)}>{value === "ALL" ? "All" : value}</button>)}
    </div>
    {loading && <div className="catalog-status">Loading your coupons...</div>}
    {error && <div className="empty-state"><h3>{error}</h3></div>}
    {!loading && !error && !visible.length && <div className="empty-state"><h3>No coupons yet</h3><p>Claim a product coupon and it will stay here until you use it.</p></div>}
    <div className="coupon-list">{visible.map((coupon) => <article className="coupon-card" key={coupon.id}>
      {coupon.image_url && <img src={coupon.image_url} alt={coupon.product_title} />}
      <div><span className="eyebrow">{coupon.shop_name}</span><h3>{coupon.product_title}</h3><code>{coupon.code}</code><p>{coupon.discount_percent}% off · {coupon.status === "VERIFIED" ? "PURCHASED / VERIFIED" : coupon.status === "REDEEMED" ? "PURCHASED / VERIFIED" : coupon.status === "CLAIMED" ? "CLAIMED / NOT PURCHASED" : coupon.status}</p><small>Claimed {new Date(coupon.claimed_at).toLocaleDateString("en-IN")}{coupon.verified_at ? ` · Verified ${new Date(coupon.verified_at).toLocaleDateString("en-IN")}` : ""}</small></div>
    </article>)}</div>
  </main>;
}

function App() {
  const [claimedCoupons, setClaimedCoupons] = useState<
  Record<string, string>
>({});
  const [path, setPath] = useState(window.location.pathname);
  const [, setError] = useState("");
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState<Array<string | number>>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogHasMore, setCatalogHasMore] = useState(true);
  const catalogEndRef = useRef<HTMLDivElement>(null);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product>();
  const [showSearch, setShowSearch] = useState(false);
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [visualMatches, setVisualMatches] = useState<VisualMatch[]>([]);
  const [visualBusy, setVisualBusy] = useState(false);
  const [visualProgress, setVisualProgress] = useState(0);
  const [visualError, setVisualError] = useState("");
  const [coupon, setCoupon] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const apiBase =
    (import.meta as ImportMeta & { env?: { VITE_API_URL?: string } }).env
      ?.VITE_API_URL || "http://localhost:5000/api/v1";
  const navigateHome = () => go("/");
  const toggleSaved = async (id: string | number) => {
    const token = localStorage.getItem("findit_user_token");
    if (!token) {
      go("/login");
      return;
    }
    try {
      const isSaved = saved.some((item) => String(item) === String(id));
      await axios({
        method: isSaved ? "delete" : "post",
        url: `${apiBase}/user/favorites/${id}`,
        headers: { Authorization: `Bearer ${token}` },
      });
      setSaved((current) =>
        isSaved
          ? current.filter((item) => String(item) !== String(id))
          : [...current, id],
      );
    } catch (requestError: any) {
      setError(
        requestError.response?.data?.message ||
          "This favorite could not be updated.",
      );
    }
  };
  const claim = async (productId: string): Promise<string | undefined> => {
    const token = localStorage.getItem("findit_user_token");
    if (!token) {
      go("/login");
      return undefined;
    }
    try {
      const response = await axios.post(
        `${apiBase}/public/products/${productId}/coupon`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setCoupon(response.data.data.code);
      return response.data.data.code;
    } catch (requestError) {
      setError(
        (requestError as any)?.response?.data?.message ||
          "Coupon could not be claimed.",
      );
      return undefined;
    }
  };
  useEffect(() => {
    const listener = () => setPath(window.location.pathname);
    window.addEventListener("popstate", listener);
    return () => window.removeEventListener("popstate", listener);
  }, []);
  useEffect(() => {
    const match = path.match(/^\/product\/([^/]+)$/);
    if (!match) {
      setSelectedProduct(undefined);
      return;
    }
    const existing = catalog.find((item) => String(item.id) === match[1]);
    if (existing) {
      setSelectedProduct(existing);
    }
    axios
      .get(`${apiBase}/public/products/${match[1]}`)
      .then(({ data }) => {
        const product = data.data.product;
        const firstMedia = data.data.media?.[0];
        setSelectedProduct(
          mapProductRow({
            ...product,
            shop_name: product.shop_name,
            seller_id: product.seller_id,
            mobile_number: product.mobile_number,
            address_line: product.address_line,
            location_url: product.location_url,
            image_url: firstMedia?.url,
          }),
        );
      })
      .catch(() => setError("This product could not be loaded."));
  }, [apiBase, catalog, path]);
  useEffect(() => {
    const apiBase =
      (import.meta as ImportMeta & { env?: { VITE_API_URL?: string } }).env
        ?.VITE_API_URL || "http://localhost:5000/api/v1";
    axios
      .get(`${apiBase}/public/products?page=1&limit=12`)
      .then(({ data }) => {
        const rows = data.data || [];
        if (rows.length) setCatalog(rows.map(mapProductRow));
        setCatalogHasMore(
          Boolean(data.pagination?.page < data.pagination?.totalPages),
        );
      })
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    const loadNextPage = async () => {
      if (
        catalogLoading ||
        !catalogHasMore ||
        window.innerHeight + window.scrollY < document.body.offsetHeight - 700
      )
        return;
      setCatalogLoading(true);
      const nextPage = catalogPage + 1;
      try {
        const response = await axios.get(
          `${apiBase}/public/products?page=${nextPage}&limit=12`,
        );
        setCatalog((current) => [
          ...current,
          ...(response.data.data || []).map(mapProductRow),
        ]);
        setCatalogPage(nextPage);
        setCatalogHasMore(
          Boolean(
            response.data.pagination?.page <
              response.data.pagination?.totalPages,
          ),
        );
      } finally {
        setCatalogLoading(false);
      }
    };
    window.addEventListener("scroll", loadNextPage, { passive: true });
    void loadNextPage();
    return () => window.removeEventListener("scroll", loadNextPage);
  }, [apiBase, catalogHasMore, catalogLoading, catalogPage]);
  const productMatch = path.match(/^\/product\/([^/]+)$/);
  const shopMatch = path.match(/^\/shop\/(\d+)$/);
  const product = productMatch
    ? catalog.find((item) => String(item.id) === productMatch[1])
    : undefined;
  const seller = shopMatch
    ? sellers.find((item) => item.id === Number(shopMatch[1]))
    : undefined;
  const searchByImage = async (file: File | undefined) => {
    if (!file) return;
    setVisualBusy(true);
    setVisualProgress(8);
    setVisualError("");
    setVisualMatches([]);
    setCoupon("");
    try {
      const form = new FormData();
      form.append("image", file);
      setVisualProgress(28);
      const response = await axios.post(`${apiBase}/public/ai-search`, form);
      setVisualProgress(92);
      setVisualMatches(response.data.data || []);
    } catch (error: any) {
      setVisualError(
        error.response?.data?.message ||
          "Unable to search this image. Please try again.",
      );
    } finally {
      setVisualProgress(100);
      setVisualBusy(false);
    }
  };
  const createCoupon = async (productId: string) => {
    const token = localStorage.getItem("findit_user_token");
    if (!token) {
      setVisualError("Please sign in before claiming a FindIt coupon.");
      go("/login");
      return;
    }
    try {
      const response = await axios.post(
        `${apiBase}/public/products/${productId}/coupon`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setCoupon(response.data.data.code);
    } catch (error: any) {
      setVisualError(
        error.response?.data?.message ||
          "We could not generate your visit coupon.",
      );
    }
  };
  if (path === "/login")
    return (
      <>
        <Header openSearch={() => undefined} home={navigateHome} />
        <UserAuth login />
      </>
    );
  if (path === "/register")
    return (
      <>
        <Header openSearch={() => undefined} home={navigateHome} />
        <UserAuth />
      </>
    );
  return (
    <div className="app-shell">
      <Header openSearch={() => setShowSearch(true)} home={navigateHome} />
      {product ? (
        <ProductDetail product={product} claim={claim} apiBase={apiBase} />
      ) : seller ? (
        <ShopDetail seller={seller} />
      ) : (
        <Home
          catalog={catalog}
          search={search}
          setSearch={setSearch}
          saved={saved}
          toggleSaved={toggleSaved}
          openImage={() => setShowImageSearch(true)}
        />
      )}
      <nav className="bottom-nav">
        {[
          ["⌂", "Home"],
          ["⌕", "Discover"],
          ["♡", "Saved"],
          ["♙", "Profile"],
        ].map(([icon, label]) => (
          <button
            key={label}
            className={
              path === "/" && label === "Home" ? "nav-item active" : "nav-item"
            }
            onClick={() =>
              label === "Home"
                ? navigateHome()
                : label === "Discover"
                  ? setShowSearch(true)
                  : undefined
            }
          >
            <Icon>{icon}</Icon>
            <span>{label}</span>
          </button>
        ))}
      </nav>
      {showSearch && (
        <div className="modal-backdrop" onClick={() => setShowSearch(false)}>
          <div
            className="search-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button className="close" onClick={() => setShowSearch(false)}>
              ×
            </button>
            <span className="eyebrow">SEARCH FINDIT</span>
            <h2>What are you looking for?</h2>
            <div className="modal-input">
              <Icon>⌕</Icon>
              <input
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Try “silk saree” or “Ring Road”"
              />
              <button
                onClick={() => {
                  setShowSearch(false);
                  navigateHome();
                }}
              >
                Search
              </button>
            </div>
            <div className="suggestions">
              <span>Popular searches</span>
              <button onClick={() => setSearch("saree")}>Sarees</button>
              <button onClick={() => setSearch("organza")}>Organza</button>
              <button onClick={() => setSearch("Ring Road")}>Ring Road</button>
            </div>
          </div>
        </div>
      )}
      {showImageSearch && (
        <div
          className="modal-backdrop"
          onClick={() => setShowImageSearch(false)}
        >
          <div
            className="image-modal visual-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button className="close" onClick={() => setShowImageSearch(false)}>
              ×
            </button>
            {!visualMatches.length && !visualBusy ? (
              <>
                <div className="upload-icon">▧</div>
                <span className="eyebrow">VISUAL SEARCH</span>
                <h2>Find a look you love</h2>
                <p>
                  Upload a photo and Qdrant will find the closest approved
                  products in Surat.
                </p>
                <button
                  className="upload-button"
                  onClick={() => fileRef.current?.click()}
                >
                  Choose an image <span>→</span>
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  onChange={(event) => searchByImage(event.target.files?.[0])}
                />
                <small>JPG, PNG or WEBP · Max 10 MB</small>
              </>
            ) : (
              <>
                <span className="eyebrow">VISUAL MATCHES</span>
                <h2>
                  {visualBusy
                    ? "Reading your design..."
                    : `${visualMatches.length} products found`}
                </h2>
                {visualError && <p className="auth-error">{visualError}</p>}
                {visualBusy ? (
                  <div className="search-loading">
                    Creating image embedding and searching nearby shops...
                  </div>
                ) : (
                  <div className="visual-results">
                    {visualMatches.map((match) => (
                      <article key={match.id}>
                        <div>
                          <b>{match.title}</b>
                          <span>
                            {match.shop_name} · {match.area}
                          </span>
                          <small>
                            {Math.round(match.similarity * 100)}% visual match
                          </small>
                        </div>
                        <button onClick={() => createCoupon(match.id)}>
                          Get 10% visit coupon
                        </button>
                      </article>
                    ))}
                  </div>
                )}
                {coupon && (
                  <div className="coupon-result">
                    <b>Your FindIt visit coupon</b>
                    <code>{coupon}</code>
                    <span>
                      Show this at the matching shop for 10% off.
                      hours.
                    </span>
                  </div>
                )}
                <button
                  className="upload-button"
                  onClick={() => {
                    setVisualMatches([]);
                    setCoupon("");
                  }}
                >
                  Search another image
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function UserExperience({claimedCoupons, setClaimedCoupons}: any) {
  const [path, setPath] = useState(window.location.pathname);
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState<Array<string | number>>(() => {
    try {
      return JSON.parse(localStorage.getItem("findit_saved") || "[]");
    } catch {
      return [];
    }
  });
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product>();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [imageSearch, setImageSearch] = useState(false);
  const [matches, setMatches] = useState<VisualMatch[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [coupon, setCoupon] = useState("");
  const [activeCoupons, setActiveCoupons] = useState<Record<string, { code: string; status: string }>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  
  const toggleSaved = async (id: string | number) => {
    const token = localStorage.getItem("findit_user_token");
    if (!token) {
      go("/login");
      return;
    }
    try {
      const isSaved = saved.some((item) => String(item) === String(id));
      await axios({
        method: isSaved ? "delete" : "post",
        url: `${apiBase}/user/favorites/${id}`,
        headers: { Authorization: `Bearer ${token}` },
      });
      setSaved((current) =>
        isSaved
          ? current.filter((item) => String(item) !== String(id))
          : [...current, id],
      );
    } catch (requestError: any) {
      setError(
        requestError.response?.data?.message ||
          "This favorite could not be updated.",
      );
    }
  };
  const loadPage = async (nextPage: number) => {
    if (loadingMore || (!hasMore && nextPage !== 1)) return;
    setLoadingMore(true);
    try {
      const response = await axios.get(
        `${apiBase}/public/products?page=${nextPage}&limit=20&search=${encodeURIComponent(search.trim())}`,
      );
      setCatalog((current) =>
        nextPage === 1
          ? (response.data.data || []).map(mapProductRow)
          : [...current, ...(response.data.data || []).map(mapProductRow)],
      );
      setPage(nextPage);
      setHasMore(
        Boolean(
          response.data.pagination?.page < response.data.pagination?.totalPages,
        ),
      );
    } catch (requestError) {
      setError(
        (requestError as any)?.response?.data?.message ||
          "Products could not be loaded.",
      );
    } finally {
      setLoadingMore(false);
    }
  };
  useEffect(() => {
    const token = localStorage.getItem("findit_user_token");
    if (!token) {
      setActiveCoupons({});
      return;
    }
    axios.get(`${apiBase}/user/coupons`, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => {
        const current: Record<string, { code: string; status: string }> = {};
        for (const item of data.data || []) {
          if (item.status === "CLAIMED") current[String(item.product_id)] = { code: item.code, status: item.status };
        }
        setActiveCoupons(current);
      })
      .catch((requestError) => {
        if (requestError.response?.status === 401) {
          localStorage.removeItem("findit_user_token");
          setActiveCoupons({});
        }
      });
  }, [apiBase, path]);
  useEffect(() => {
    if (path === "/saved") return;
    setHasMore(true);
    void loadPage(1);
  }, [search, path]);
  useEffect(() => {
    const listener = () => setPath(window.location.pathname);
    window.addEventListener("popstate", listener);
    return () => window.removeEventListener("popstate", listener);
  }, []);
  useEffect(() => {
    const match = path.match(/^\/product\/([^/]+)$/);
    if (!match) {
      setSelectedProduct(undefined);
      return;
    }
    const existing = catalog.find((item) => String(item.id) === match[1]);
    if (existing) {
      setSelectedProduct(existing);
      return;
    }
    axios
      .get(`${apiBase}/public/products/${match[1]}`)
      .then(({ data }) => {
        const product = data.data.product;
        const firstMedia = data.data.media?.[0];
        setSelectedProduct(
          mapProductRow({ ...product, image_url: firstMedia?.url, sellerMedia: data.data.sellerMedia }),
        );
      })
      .catch(() => setError("This product could not be loaded."));
  }, [apiBase, catalog, path]);
  useEffect(() => {
    const token = localStorage.getItem("findit_user_token");
    if (!token) return;
    axios
      .get(`${apiBase}/user/favorites`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(({ data }) =>
        setSaved((data.data || []).map((item: any) => item.id)),
      )
      .catch(() => undefined);
  }, [apiBase]);
  useEffect(() => {
    if (path !== "/saved") return;
    const token = localStorage.getItem("findit_user_token");
    if (!token) {
      go("/login");
      return;
    }
    axios
      .get(`${apiBase}/user/favorites`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(({ data }) => setCatalog((data.data || []).map(mapProductRow)))
      .catch(() => setError("Your favorites could not be loaded."));
  }, [apiBase, path]);
  useEffect(() => {
    const onScroll = () => {
      if (
        path !== "/saved" &&
        window.innerHeight + window.scrollY > document.body.offsetHeight - 700
      )
        void loadPage(page + 1);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [page, hasMore, loadingMore, path]);
  const searchImage = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setProgress(12);
    setError("");
    setMatches([]);
    setCoupon("");
    try {
      const body = new FormData();
      body.append("image", file);
      setProgress(35);
      const response = await axios.post(`${apiBase}/public/ai-search`, body);
      setProgress(92);
      setMatches(response.data.data || []);
    } catch (requestError) {
      setError(
        (requestError as any)?.response?.data?.message ||
          "Image search could not be completed.",
      );
    } finally {
      setProgress(100);
      setBusy(false);
    }
  };
  const claim = async (productId: string): Promise<string | undefined> => {
    const token = localStorage.getItem("findit_user_token");
    if (!token) {
      go("/login");
      return undefined;
    }
    try {
      const response = await axios.post(
        `${apiBase}/public/products/${productId}/coupon`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setCoupon(response.data.data.code);
      setActiveCoupons((current) => ({ ...current, [productId]: { code: response.data.data.code, status: "CLAIMED" } }));
      return response.data.data.code;
    } catch (requestError) {
      setError(
        (requestError as any)?.response?.data?.message ||
          "Coupon could not be claimed.",
      );
      return undefined;
    }
  };
  if (path === "/login")
    return (
      <>
        <Header openSearch={() => undefined} home={() => go("/")} />
        <UserAuth login />
      </>
    );
  if (path === "/register")
    return (
      <>
        <Header openSearch={() => setImageSearch(true)} home={() => go("/")} />
        <UserAuth />
      </>
    );
  if (path === "/coupons") {
    if (!localStorage.getItem("findit_user_token")) {
      go("/login");
      return null;
    }
    return (
      <>
        <Header openSearch={() => setImageSearch(true)} home={() => go("/")} />
        <CouponsPage apiBase={apiBase} />
      </>
    );
  }
  if (path === "/saved" && !localStorage.getItem("findit_user_token")) {
    go("/login");
    return null;
  }
  if (path === "/account") {
    if (!localStorage.getItem("findit_user_token")) {
      go("/login");
      return null;
    }
    return (
      <>
        <Header openSearch={() => setImageSearch(true)} home={() => go("/")} />
        <ProfilePage apiBase={apiBase} />
      </>
    );
  }
  const shopMatch = path.match(/^\/shop\/([^/]+)$/);
  if (shopMatch)
    return (
      <>
        <Header openSearch={() => setImageSearch(true)} home={() => go("/")} />
        <PublicShop shopId={shopMatch[1]} apiBase={apiBase} saved={saved} toggleSaved={toggleSaved} />
      </>
    );
  if (selectedProduct)
    return (
      <>
        <Header openSearch={() => setImageSearch(true)} home={() => go("/")} />
        <ProductDetail product={selectedProduct} claim={claim} apiBase={apiBase} existingCoupon={activeCoupons[String(selectedProduct.id)]} />
      </>
    );
  return (
    <div className="app-shell">
      <Header openSearch={() => setImageSearch(true)} home={() => go("/")} />
      <Home
        catalog={catalog}
        search={search}
        setSearch={setSearch}
        saved={saved}
        toggleSaved={toggleSaved}
        openImage={() => setImageSearch(true)}
        onCoupon={(productId) => void claim(productId)}
        coupons={activeCoupons}
        showSaved={path === "/saved"}
      />
      <div className="catalog-status">
        {loadingMore
          ? "Loading more products..."
          : error || (!hasMore ? "You reached the end of the catalogue." : "")}
      </div>
      {imageSearch && (
        <div className="modal-backdrop" onClick={() => setImageSearch(false)}>
          <div
            className="image-modal visual-modal rich-visual-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button className="close" onClick={() => setImageSearch(false)}>
              ×
            </button>
            {!matches.length && !busy ? (
              <>
                <div className="upload-icon">▧</div>
                <span className="eyebrow">VISUAL SEARCH</span>
                <h2>Find a look you love</h2>
                <p>
                  Upload a product image and FindIt will rank relevant Surat
                  products.
                </p>
                <button
                  className="upload-button"
                  onClick={() => fileRef.current?.click()}
                >
                  Choose an image
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  onChange={(event) =>
                    void searchImage(event.target.files?.[0])
                  }
                />
              </>
            ) : (
              <>
                <span className="eyebrow">VISUAL MATCHES</span>
                <h2>
                  {busy
                    ? `Reading your design... ${progress}%`
                    : `${matches.length} products found`}
                </h2>
                {busy ? (
                  <div className="search-loading">
                    Creating image embedding and searching approved products...{" "}
                    {progress}%
                  </div>
                ) : (
                  <div className="visual-results">
                    {matches.map((match) => (
                      <VisualMatchCard
                        key={match.id}
                        match={match}
                        onCoupon={claim}
                      />
                    ))}
                  </div>
                )}
                {error && <p className="auth-error">{error}</p>}
                {coupon && (
                  <div className="coupon-result">
                    <b>Your FindIt visit coupon</b>
                    <code>{coupon}</code>
                    <span>
                      Show it to the seller at checkout for 10% off.
                    </span>
                  </div>
                )}
                <button
                  className="upload-button"
                  onClick={() => {
                    setMatches([]);
                    setCoupon("");
                    setError("");
                  }}
                >
                  Search another image
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<UserExperience />);
