import { useEffect, useRef } from "react";

function loadBuyButton() {
  return new Promise((resolve) => {
    if (window.ShopifyBuy && window.ShopifyBuy.UI) return resolve(window.ShopifyBuy);
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js";
    s.onload = () => resolve(window.ShopifyBuy);
    document.head.appendChild(s);
  });
}

/**
 * Renders a Shopify collection grid with an on-page cart (Buy Button UI).
 * Props:
 *  - shopDomain: "yourstore.myshopify.com"
 *  - storefrontAccessToken: "xxxxxxxxxxxxxxxxxxxx"
 *  - collectionId: number | "gid://shopify/Collection/1234567890"
 */
export default function ShopifyCollection({ shopDomain, storefrontAccessToken, collectionId }) {
  const nodeRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    loadBuyButton().then((ShopifyBuy) => {
      if (!mounted || !nodeRef.current) return;

      const client = ShopifyBuy.buildClient({
        domain: shopDomain,
        storefrontAccessToken,
      });

      ShopifyBuy.UI.onReady(client).then((ui) => {
        ui.createComponent("collection", {
          id: collectionId,
          node: nodeRef.current,
          moneyFormat: "%24%7B%7Bamount%7D%7D", // ${{amount}}
          options: {
            product: {
              styles: {
                product: {
                  backgroundColor: "#0a0a0a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "16px",
                  color: "#e5e7eb",
                },
                title: { color: "#ffffff", fontWeight: "700" },
                price: { color: "#e5e7eb" },
                button: {
                  backgroundColor: "#ffffff",
                  color: "#0a0a0a",
                  borderRadius: "9999px",
                  padding: "12px 16px",
                },
              },
              text: { button: "Add to cart" },
              contents: { img: true, title: true, price: true, options: false },
            },
            modalProduct: {
              styles: {
                product: { backgroundColor: "#0a0a0a", color: "#e5e7eb" },
                button: { backgroundColor: "#ffffff", color: "#0a0a0a" },
              },
            },
            cart: {
              popup: false,
              styles: {
                cart: { backgroundColor: "#0a0a0a", color: "#e5e7eb" },
                footer: { backgroundColor: "#0a0a0a" },
                button: { backgroundColor: "#ffffff", color: "#0a0a0a" },
              },
              text: { total: "Subtotal", button: "Checkout" },
            },
            toggle: {
              styles: { toggle: { backgroundColor: "#ffffff", color: "#0a0a0a" } },
            },
          },
        });
      });
    });

    return () => { mounted = false; };
  }, [shopDomain, storefrontAccessToken, collectionId]);

  return <div ref={nodeRef} />;
}
