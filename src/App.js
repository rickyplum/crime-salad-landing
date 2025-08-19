import React, { useState, useEffect } from "react";

// Crime Salad — Clean, Fancy + Spotify Embed + Press Marquee + Flickering Art (CRA + Tailwind)
// Paste this whole file into src/App.js

const LINKS = {
  APPLE: "https://podcasts.apple.com/us/podcast/crime-salad/id1457141569",
  SPOTIFY: "https://open.spotify.com/show/3i7DxU0YyDnaMVdDrF4fpG",
  YOUTUBE: "https://www.youtube.com/crimesalad",
  TIKTOK: "https://www.tiktok.com/@crimesaladpodcast?is_from_webapp=1&sender_device=pc",
  PATREON: "https://www.patreon.com/c/Crimesaladpodcast",
  INSTAGRAM: "https://www.instagram.com/crimesaladpodcast",
  X: "https://x.com/crimesalad",
};

// Inline image data URI. Leave empty to use /hosts-banner.jpg from public/
// Inline image data URI. Leave empty to use /hosts-banner.jpg from public/
const HOSTS_BANNER = "";
const HOSTS_PUBLIC = `${process.env.PUBLIC_URL || ''}/hosts-banner.jpg`;
const HOSTS_PUBLIC_ALT = `${process.env.PUBLIC_URL || ''}/hosts.jpg`;   // <— add this
const PLACEHOLDER = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="%2318181b"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23a1a1aa" font-family="Arial, Helvetica, sans-serif" font-size="24">Image unavailable</text></svg>';
const CONTACT_EMAIL = "crimesaladpodcast@gmail.com";
function SpotifyPlayer({ showId, episodeId }) {
  const src = `https://open.spotify.com/embed/${episodeId ? `episode/${episodeId}` : `show/${showId}`}?utm_source=generator&theme=0`;
  return (
    <div className="rounded-xl overflow-hidden border border-white/10 shadow">
      <iframe
        title="Spotify Player"
        src={src}
        width="100%"
        height={episodeId ? 232 : 152}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
    </div>
  );
}


// --- Shopify Collection (client-side; uses Storefront API if token present) ---
function ShopifyCollection({ shopDomain, storefrontAccessToken, collectionId, limit = 12 }) {
  const [products, setProducts] = useState(null);
  const [err, setErr] = useState(null);
  const id = String(collectionId || "");
  const gid = id.startsWith("gid://") ? id : `gid://shopify/Collection/${id}`;

  useEffect(() => {
    let active = true;
    async function run() {
      if (!storefrontAccessToken) { return; }
      try {
        const res = await fetch(`https://${shopDomain}/api/2024-07/graphql.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Storefront-Access-Token': storefrontAccessToken,
          },
          body: JSON.stringify({
            query: `
              query CollectionProducts($id: ID!, $first: Int!) {
                collection(id: $id) {
                  title
                  products(first: $first) {
                    edges {
                      node {
                        id
                        title
                        handle
                        featuredImage { url altText }
                        images(first: 4) { edges { node { url altText } } }
                        priceRange { minVariantPrice { amount currencyCode } }
                      }
                    }
                  }
                }
              }
            `,
            variables: { id: gid, first: limit },
          })
        });
        const json = await res.json();
        if (!active) return;
        if (json.errors) throw new Error(json.errors[0]?.message || 'Storefront API error');
        const edges = json.data?.collection?.products?.edges ?? [];
        setProducts(edges.map(e => e.node));
      } catch (e) {
        if (active) setErr(e);
      }
    }
    run();
    return () => { active = false; };
  }, [shopDomain, storefrontAccessToken, gid, limit]);

  // Fallback if no token: simple button to shop
  if (!storefrontAccessToken) {
    return (
      <div className="text-center">
        <a
          href={`https://${shopDomain}/collections/all`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-white text-zinc-900 px-5 py-3 text-sm font-semibold hover:bg-zinc-200"
        >
          Browse the shop
        </a>
        <p className="mt-2 text-xs text-zinc-500">Add REACT_APP_SHOPIFY_STOREFRONT_TOKEN to enable in-page products.</p>
      </div>
    );
  }

  if (err) {
    return <p className="text-sm text-rose-400">Couldn't load products. {String(err.message || err)}</p>;
  }

  if (!products) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-3 animate-pulse h-56" />
        ))}
      </div>
    );
  }

  if (!products.length) {
    return <p className="text-zinc-400">No products found.</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
      {products.map((p) => {
        const fallbackEdge = p.images?.edges?.find((e) => e?.node?.url)?.node;
        const imgUrl = p.featuredImage?.url || fallbackEdge?.url || PLACEHOLDER;
        const alt = p.featuredImage?.altText || fallbackEdge?.altText || p.title;
        const price = p.priceRange?.minVariantPrice?.amount
          ? `${p.priceRange.minVariantPrice.amount} ${p.priceRange.minVariantPrice.currencyCode}`
          : '';
        const href = `https://${shopDomain}/products/${p.handle}`;
        return (
          <a
            key={p.id}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-2xl border border-white/10 bg-white/5 overflow-hidden hover:bg-white/10"
          >
            <div className="aspect-square overflow-hidden">
              <img
                src={imgUrl}
                alt={alt}
                className="h-full w-full object-cover transition scale-100 group-hover:scale-[1.03]"
                onError={(e) => {
                  const ph = "https://images.unsplash.com/photo-1520975922284-9d8a5c0fbf38?q=80&w=800&auto=format&fit=crop";
                  if (e.currentTarget.src !== ph) e.currentTarget.src = ph;
                }}
              />
            </div>
            <div className="p-3">
              <div className="font-semibold leading-tight">{p.title}</div>
              {price && <div className="text-sm text-zinc-400 mt-1">{price}</div>}
            </div>
          </a>
        );
      })}
    </div>
  );
}

export default function App() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [email, setEmail]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [message, setMessage]     = useState(null);

  async function handleJoin(e) {
    e.preventDefault();
    if (!email || !/@/.test(email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email.' });
      return;
    }
    setLoading(true);
    setMessage(null);

    try {
      const subject = 'Join the List signup';
      const body = `Please add me to the list. Name: ${firstName} ${lastName} Email: ${email}`;
      const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      // Trigger the user's email client
      window.location.href = mailto;

      setMessage({ type: 'success', text: 'Opening your email app… if nothing opens, email us directly at ' + CONTACT_EMAIL + '.' });
      setFirstName(''); setLastName(''); setEmail('');
    } catch (err) {
      setMessage({ type: 'error', text: 'Could not open your mail app. Please email us directly at ' + CONTACT_EMAIL + '.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-fuchsia-400/30">
      {/* ===== Background Orbs / Glow ===== */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-[28rem] w-[28rem] rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute top-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-cyan-300/10 blur-3xl" />
      </div>

      {/* ===== Navbar ===== */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950/70 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-20 grid grid-cols-3 items-center">
          {/* Left: Brand (text logo, all caps) */}
          <div className="flex items-center">
            <span className="text-xl sm:text-2xl font-extrabold tracking-[0.18em] uppercase">CRIME SALAD</span>
          </div>

          {/* Center: Nav */}
          <nav className="hidden md:flex justify-center items-center gap-8 text-sm text-zinc-300">
            {/* Removed Listen */}
            <a href="#join-the-list" className="hover:text-white">Join the List</a>
            <a href="#shop" className="hover:text-white">Shop</a>
            <a href={"mailto:" + CONTACT_EMAIL} className="hover:text-white">Contact</a>
          </nav>

          {/* Right: Patreon button */}
          <div className="flex justify-end items-center gap-3">
            <span className="hidden sm:inline text-sm text-zinc-300">Support us on</span>
            <a
              href={LINKS?.PATREON ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Support us on Patreon"
              className="inline-flex items-center gap-2 rounded-xl bg-[#ff424d] text-white px-4 py-2 text-sm font-semibold shadow-sm hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="currentColor">
                <rect x="3" y="3" width="4" height="18" rx="1.2" />
                <circle cx="16" cy="10" r="6" />
              </svg>
              Patreon
            </a>
          </div>
        </div>
      </header>

      {/* ===== Global styles for flicker/glint + hero line fade ===== */}
      <style>{`
        @keyframes flicker {
          0%{opacity:.9;filter:brightness(1.05)}2%{opacity:.15;filter:brightness(.9)}
          3%{opacity:.85}5%{opacity:.25}7%{opacity:.8}8%{opacity:.3}
          10%{opacity:.95}13%{opacity:.55}20%{opacity:.98}100%{opacity:.88}
        }
        @keyframes sweep { 0%{transform:translateX(-60%) rotate(18deg)} 100%{transform:translateX(160%) rotate(18deg)} }
        .cs-flicker { mix-blend-mode: screen; animation: flicker 4.6s infinite; }
        .cs-glint { filter: blur(6px); animation: sweep 9s ease-in-out infinite; }
        .tilt { perspective: 900px; }
        .tilt-inner { transition: transform .6s ease, filter .6s ease; transform-style: preserve-3d; }
        .tilt:hover .tilt-inner { transform: rotateX(2deg) rotateY(-4deg) translateY(-2px); filter: brightness(1.02); }
        @keyframes scan { from { background-position: 0 0; } to { background-position: 0 14px; } }
        .scanlines { background-image: repeating-linear-gradient(to bottom, rgba(255,255,255,.05) 0, rgba(255,255,255,.05) 1px, rgba(0,0,0,0) 4px, rgba(0,0,0,0) 8px); opacity:.12; mix-blend-mode: soft-light; animation: scan 7s linear infinite; }
        .edge-fringe { pointer-events:none; mix-blend-mode: screen; background:
          radial-gradient(120% 100% at 0% 0%, rgba(255,0,95,.25), rgba(255,0,95,0) 60%),
          radial-gradient(120% 100% at 100% 100%, rgba(0,170,255,.25), rgba(0,170,255,0) 60%);
          -webkit-mask-image: radial-gradient(120% 120% at 50% 50%, transparent 55%, black 80%);
                  mask-image: radial-gradient(120% 120% at 50% 50%, transparent 55%, black 80%);
        }
        .fade-line { opacity: 0; transform: translateY(6px); animation: fadeInUp .7s ease forwards; }
        @keyframes fadeInUp { to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* ===== Hero ===== */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24 grid md:grid-cols-[520px_1fr] gap-12 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">True Crime Podcast</p>
            <h1 className="mt-3 text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.1]">
              <span className="bg-gradient-to-r from-fuchsia-300 via-violet-200 to-cyan-200 bg-clip-text text-transparent block fade-line mb-1.5 sm:mb-2 last:mb-0" style={{animationDelay:'0s'}}>Bite sized.</span>
              <span className="bg-gradient-to-r from-fuchsia-300 via-violet-200 to-cyan-200 bg-clip-text text-transparent block fade-line mb-1.5 sm:mb-2 last:mb-0" style={{animationDelay:'.12s'}}>True Crime.</span>
              <span className="bg-gradient-to-r from-fuchsia-300 via-violet-200 to-cyan-200 bg-clip-text text-transparent block fade-line mb-1.5 sm:mb-2 last:mb-0" style={{animationDelay:'.24s'}}>Weekly.</span>
            </h1>
            <p className="mt-4 text-lg text-zinc-300 max-w-xl">
              Real cases told with empathy and rigor — hosted by Ashley and Ricky.
            </p>

            {/* Listen CTAs */}
            <div id="listen" className="mt-7 flex flex-wrap gap-3">
              <a
                className="group inline-flex items-center gap-2 rounded-xl bg-white text-zinc-900 px-4 py-2 font-medium shadow hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-white/30"
                href={LINKS?.SPOTIFY ?? "#"}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M12 1.5A10.5 10.5 0 1 0 22.5 12 10.512 10.512 0 0 0 12 1.5Zm4.58 15.16a.75.75 0 0 1-1.04.22 9.7 9.7 0 0 0-7.58-.9.75.75 0 0 1-.42-1.44 11.2 11.2 0 0 1 8.76 1.02.75.75 0 0 1 .28 1.1Zm1.4-3.07a.94.94 0 0 1-1.3.32 11.86 11.86 0 0 0-9.36-1.25.93.93 0 0 1-.46-1.81 13.73 13.73 0 0 1 10.86 1.45.93.93 0 0 1 .26 1.29Zm.14-3a1.11 1.11 0 0 1-1.55.39 14.86 14.86 0 0 0-11.73-1.5 1.11 1.11 0 0 1-.65-2.12 17.06 17.06 0 0 1 13.45 1.72 1.12 1.12 0 0 1 .48 1.51Z"/></svg>
                Listen on Spotify
              </a>
              <a className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20" href={LINKS?.APPLE ?? "#"}>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M16.37 1.43c-.93.06-2.05.64-2.7 1.39-.59.67-1.11 1.78-.91 2.79.98.08 2.01-.53 2.66-1.28.6-.7 1.09-1.83.95-2.9ZM13.95 5.23c-1.52 0-3.18.88-4.14 2.23-1.79 2.55-.47 6.31 1.28 8.38.85 1.03 1.86 2.19 3.18 2.15 1.28-.06 1.77-.7 3.33-.7 1.54 0 2 .7 3.34.68 1.39-.02 2.25-1.04 3.08-2.08.95-1.18 1.35-2.32 1.37-2.38-.03-.01-2.63-1.01-2.66-4.02-.02-2.52 2.06-3.72 2.15-3.78-1.17-1.72-2.98-1.96-3.61-1.99-1.64-.14-3.02.92-3.81.92-.81 0-1.96-.9-3.19-.9Z"/></svg>
                Apple Podcasts
              </a>
              <a className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20" href={LINKS?.YOUTUBE ?? "#"}>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M23.5 7.6a4.8 4.8 0 0 0-3.4-3.4C17.9 3.6 12 3.6 12 3.6s-5.9 0-8.1.6A4.8 4.8 0 0 0 .5 7.6 50.4 50.4 0 0 0 0 12c0 4.4.5 4.4.5 4.4a4.8 4.8 0 0 0 3.4 3.4c2.2.6 8.1.6 8.1.6s5.9 0 8.1-.6a4.8 4.8 0 0 0 3.4-3.4s.5 0 .5-4.4-.5-4.4-.5-4.4ZM9.6 15.2V8.8l6.4 3.2-6.4 3.2Z"/></svg>
                YouTube
              </a>
              <a
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
                href={LINKS?.TIKTOK ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M16.5 3.5v3.2a6.5 6.5 0 0 0 3.1 1v3.1a8.2 8.2 0 0 1-3.1-.7v4.1c0 3.2-2.6 5.8-5.8 5.8S4.9 17.4 4.9 14.2c0-3.2 2.6-5.8 5.8-5.8.4 0 .8 0 1.2.1v3.1a2.7 2.7 0 0 0-1.2-.3 2.7 2.7 0 1 0 2.7 2.7V3.5h3.1z"/></svg>
                Watch on TikTok
              </a>
              <a
                className="inline-flex items-center gap-2 rounded-xl bg-[#ff424d] text-white px-4 py-2 font-medium shadow hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-white/30"
                href={LINKS?.PATREON ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="currentColor">
                  <rect x="3" y="3" width="4" height="18" rx="1.2" />
                  <circle cx="16" cy="10" r="6" />
                </svg>
                Ad‑Free on Patreon
              </a>
            </div>

            {/* Stats */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
              {[
                ["300+", "Victim Focused Episodes"],
                ["Top 0.1%", "of Podcasts"],
                ["Weekly", "New Episodes"],
                ["Since 2019", "Trusted Stories"],
              ].map(([num, label]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-2xl font-bold tracking-tight">{num}</div>
                  <div className="text-zinc-400">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Artwork Card with Flicker/Glint */}
          <div>
            <div className="relative mx-auto w-full max-w-md">
              <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-fuchsia-400/20 via-indigo-400/20 to-cyan-300/20 blur-2xl" />
              <div className="relative rounded-[2rem] border border-white/10 bg-zinc-900/80 p-4 shadow-2xl">
                <div className="relative overflow-hidden rounded-xl">
                  <img
                    src="https://images.squarespace-cdn.com/content/68a0d886c9764f26cf67e325/a7ccc554-e902-4c51-8f87-a058f1e1d6f8/Crime-Salad-Art.png?content-type=image%2Fpng"
                    alt="Crime Salad Artwork"
                    className="h-full w-full object-cover object-center"
                  />
                  {/* Flicker overlay */}
                  <div
                    className="pointer-events-none absolute inset-0 rounded-xl cs-flicker"
                    style={{
                      background:
                        "radial-gradient(120% 100% at 20% 0%, rgba(255,255,255,.55), rgba(255,255,255,0) 60%)," +
                        "radial-gradient(70% 55% at 80% 20%, rgba(255,220,160,.25), rgba(255,220,160,0) 60%)",
                      opacity: 0.9,
                    }}
                  />
                  {/* Moving glint */}
                  <div className="pointer-events-none absolute -inset-6 overflow-hidden">
                    <div
                      className="cs-glint absolute top-0 left-0 h-[200%] w-[35%]"
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.06) 45%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0.06) 55%, rgba(255,255,255,0) 100%)",
                        transform: "translateX(-60%) rotate(18deg)",
                      }}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-400">Latest Episode</div>
                  <SpotifyPlayer showId="3i7DxU0YyDnaMVdDrF4fpG" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== About ===== */}
      <section id="about" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold">Meet the Hosts</h3>
            <p className="mt-3 text-zinc-300 max-w-prose">
              Ashley leads the storytelling; Ricky brings context and candid reactions. Together we break down complex cases with empathy and clarity — always prioritizing the truth.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-zinc-300">
              <li>✔️ Weekly episodes & bonus deep dives</li>
              <li>✔️ Spotlight on victim advocacy and reforms</li>
              <li>✔️ Listener community with Q&As and case polls</li>
            </ul>
          </div>
          <div>
            <div className="relative tilt group mx-auto w-full max-w-md">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-fuchsia-500/20 via-indigo-400/20 to-cyan-300/20 blur-xl" />
              <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl tilt-inner h-[320px] sm:h-[360px] md:h-[380px]">
                <img
                  src={HOSTS_BANNER || HOSTS_PUBLIC}
                  alt="Ashley & Ricky — Crime Salad"
                  className="h-full w-full object-cover object-center"
                  style={{ filter: "contrast(1.08) saturate(1.1)" }}
                  onError={(e) => {
                    const el = e.currentTarget;
                    if (!el.dataset.fallbackTried) { el.dataset.fallbackTried = '1'; el.src = HOSTS_PUBLIC_ALT; return; }
                    el.onerror = null; el.src = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1600&auto=format&fit=crop";
                  }}
                />
                {/* Edge glow (keeps subjects crisp) */}
                <div className="edge-fringe absolute inset-0 rounded-3xl" />
                {/* Subtle scanlines */}
                <div className="scanlines absolute inset-0" />
                <div className="absolute inset-0 bg-gradient-to-tr from-fuchsia-500/20 via-indigo-500/15 to-cyan-400/20 mix-blend-soft-light" />
                <div className="pointer-events-none absolute inset-0 shadow-[inset_0_-120px_200px_rgba(0,0,0,0.45)]" />
              </div>
            </div>
          </div>
        </div>
      </section><section id="join-the-list" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
  <div className="p-[1px] rounded-3xl bg-gradient-to-br from-fuchsia-400/30 via-indigo-400/20 to-cyan-300/20">
    <div className="rounded-3xl bg-zinc-950/70 p-8 md:p-12 border border-white/10">
      <h3 className="text-2xl sm:text-3xl font-bold text-center">Join the List</h3>
      <p className="mt-2 text-zinc-300 max-w-xl mx-auto text-center">No spam. Just new episodes, behind‑the‑scenes, and ways to support families and advocacy.</p>

      <form
        className="mt-6 mx-auto grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]"
        action="https://crimesaladpodcast.us1.list-manage.com/subscribe/post?u=cc67224c1a30078239b64e0d3&id=466ab65f6a&f_id=00c2c3e1f0"
        method="post"
        target="_blank"
        noValidate
      >
        <label className="sr-only" htmlFor="mce-FNAME">First name</label>
        <input
          type="text"
          name="FNAME"
          id="mce-FNAME"
          placeholder="First name (optional)"
          className="rounded-xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
        />

        <label className="sr-only" htmlFor="mce-EMAIL">Email address</label>
        <input
          type="email"
          name="EMAIL"
          id="mce-EMAIL"
          required
          placeholder="Email address"
          className="rounded-xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
        />

        <div className="sm:col-span-1">
          <button type="submit" name="subscribe" className="rounded-xl bg-white text-zinc-900 px-5 py-3 text-sm font-semibold hover:bg-zinc-200 transition w-full sm:w-auto">
            Join the List
          </button>
        </div>

        {/* Mailchimp honeypot (required) */}
        <div aria-hidden="true" style={{ position: 'absolute', left: '-5000px' }}>
          <input type="text" name="b_cc67224c1a30078239b64e0d3_466ab65f6a" tabIndex={-1} defaultValue="" />
        </div>
      </form>

      <p className="mt-3 text-xs text-zinc-400 text-center">By subscribing you agree to our terms. Unsubscribe anytime.</p>
    </div>
  </div>
</section>
      {/* ===== Shop ===== */}
      <section id="shop" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <h3 className="text-2xl sm:text-3xl font-bold mb-6">Shop</h3>
        <p className="text-zinc-300 mb-8">Official Crime Salad merch.</p>

        <ShopifyCollection
          shopDomain="crimesaladpodcast.myshopify.com"
          storefrontAccessToken={process.env.REACT_APP_SHOPIFY_STOREFRONT_TOKEN || "899809aa74e2ecbe671f60a376ef7932"}
          collectionId="gid://shopify/Collection/499090194713"
        />
      </section>

      {/* ===== Footer ===== */}
      {/* ===== Contact ===== */}
      <section id="contact" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
        <div className="p-[1px] rounded-3xl bg-gradient-to-br from-fuchsia-400/30 via-indigo-400/20 to-cyan-300/20">
          <div className="rounded-3xl bg-zinc-950/70 p-8 md:p-12 text-center border border-white/10">
            <h3 className="text-2xl sm:text-3xl font-bold">Contact</h3>
            <p className="mt-2 text-zinc-300">Questions, case suggestions, or press? We’d love to hear from you.</p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a href={"mailto:" + CONTACT_EMAIL} className="inline-flex items-center gap-2 rounded-xl bg-white text-zinc-900 px-5 py-3 text-sm font-semibold hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-white/30">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M2 5.5A2.5 2.5 0 0 1 4.5 3h15A2.5 2.5 0 0 1 22 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 18.5v-13Zm2.4-.5 7.6 5.4L19.6 5H4.4Zm15.1 2.2-6.8 4.9a1.5 1.5 0 0 1-1.8 0L4.1 7.2V18.5c0 .28.22.5.5.5h15a.5.5 0 0 0 .5-.5V7.2Z"/></svg>
                Email {CONTACT_EMAIL}
              </a>
              <button type="button" onClick={() => navigator.clipboard && navigator.clipboard.writeText(CONTACT_EMAIL)} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20">
                Copy email
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 grid md:grid-cols-4 gap-10 text-sm">
          <div className="md:col-span-2">
            <span className="font-semibold text-lg">Crime Salad</span>
            <p className="mt-3 text-zinc-400 max-w-sm">True crime stories told with care. © {new Date().getFullYear()} Weird Salad Media.</p>
          </div>

          <div>
            <h6 className="text-zinc-300 font-medium">Listen</h6>
            <ul className="mt-3 space-y-2 text-zinc-400">
              <li><a href={LINKS?.APPLE ?? "#"} className="hover:text-white">Apple Podcasts</a></li>
              <li><a href={LINKS?.SPOTIFY ?? "#"} className="hover:text-white">Spotify</a></li>
              <li><a href={LINKS?.YOUTUBE ?? "#"} className="hover:text-white">YouTube</a></li>
            </ul>
          </div>

          <div>
            <h6 className="text-zinc-300 font-medium">Connect</h6>
            <ul className="mt-3 space-y-2 text-zinc-400">
              <li><a href={LINKS?.PATREON ?? "#"} target="_blank" rel="noopener noreferrer" className="hover:text-white inline-flex items-center gap-2"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true"><rect x="3" y="3" width="4" height="18" rx="1"/><circle cx="16" cy="10" r="6"/></svg>Patreon</a></li>
              <li><a href={LINKS?.INSTAGRAM ?? "#"} className="hover:text-white">Instagram</a></li>
              <li><a href={LINKS?.TIKTOK ?? "#"} className="hover:text-white">TikTok</a></li>
              <li><a href={LINKS?.X ?? "#"} className="hover:text-white">X (Twitter)</a></li>
              <li><a href={"mailto:" + CONTACT_EMAIL} className="hover:text-white">Contact</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
