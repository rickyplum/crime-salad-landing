// src/ShopifyCollection.jsx
import React, { useEffect, useState } from "react";

const PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800"><rect width="100%" height="100%" fill="%2318181b"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23a1a1aa" font-family="Arial, Helvetica, sans-serif" font-size="20">Image unavailable</text></svg>';

export default function ShopifyCollection({
  shopDomain,
  storefrontAccessToken,
  collectionId,
  limit = 12,
}) {
  const [products, setProducts] = useState(null);
  const [err, setErr] = useState(null);

  const id = String(collectionId || "");
  const gid = id.startsWith("gid://") ? id : `gid://shopify/Collection/${id}`;

  useEffect(() => {
    let active = true;
    async function run() {
      if (!storefrontAccessToken) {
        setProducts([]); // fall back to “browse the shop” if you prefer
        return;
      }
      try {
        const res = await fetch(`https://${shopDomain}/api/2024-07/graphql.json`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Storefront-Access-Token": storefrontAccessToken,
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
                        featuredImage {
                          url(transform:{maxWidth:800, preferredContentType:WEBP, crop:CENTER})
                          altText
                        }
                        images(first: 4) {
                          edges {
                            node {
                              url(transform:{maxWidth:800, preferredContentType:WEBP, crop:CENTER})
                              altText
                            }
                          }
                        }
                        priceRange { minVariantPrice { amount currencyCode } }
                      }
                    }
                  }
                }
              }
            `,
            variables: { id: gid, first: limit },
          }),
        });

        const json = await res.json();
        if (!active) return;
        if (json.errors) throw new Error(json.errors[0]?.message || "Storefront API error");

        const edges = json.data?.collection?.products?.edges ?? [];
        setProducts(edges.map((e) => e.node));
      } catch (e) {
        if (active) setErr(e);
      }
    }
    run();
    return () => {
      active = false;
    };
  }, [shopDomain, storefrontAccessToken, gid, limit]);

  if (err) {
    return (
      <p className="text-sm text-rose-400">
        Couldn't load products. {String(err.message || err)}
      </p>
    );
  }

  if (!products) {
    // skeletons while loading
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-3 animate-pulse h-56" />
        ))}
      </div>
    );
  }

  if (!products.length) {
    // no products returned (or no token)
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
        <p className="mt-2 text-xs text-zinc-500">
          (If this is unexpected, check your Storefront token and that products are published.)
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
      {products.map((p) => {
        const fallbackEdge = p.images?.edges?.find((e) => e?.node?.url)?.node;
        const imgUrl = p.featuredImage?.url || fallbackEdge?.url || PLACEHOLDER;
        const alt = p.featuredImage?.altText || fallbackEdge?.altText || p.title;
        const price = p.priceRange?.minVariantPrice?.amount
          ? `${p.priceRange.minVariantPrice.amount} ${p.priceRange.minVariantPrice.currencyCode}`
          : "";
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
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full w-full object-cover transition scale-100 group-hover:scale-[1.03]"
                onError={(e) => {
                  if (e.currentTarget.src !== PLACEHOLDER) e.currentTarget.src = PLACEHOLDER;
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
