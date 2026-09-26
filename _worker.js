const PRODUCTS = {
  mini: { name: "Mini Mystery Scoop", price: 1500 },
  regular: { name: "Regular Mystery Scoop", price: 2500 },
  large: { name: "Large Mystery Scoop", price: 4500 },
  double: { name: "Regular Double Scoop", price: 4500 },
  triple: { name: "Regular Triple Scoop", price: 6500 },
  packing_video: { name: "Packing Video Add-on", price: 1200 },
  rare: { name: "Extra Rare Ball", price: 1000 }
};
const SHIPPING = { name: "Shipping", price: 2000 };
const LOCATION_ID = "1ZFPQECPE0P38";
const SQUARE_API = "https://connect.squareup.com/v2/online-checkout/payment-links";

export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS"
    };
    const url = new URL(request.url);
    if (url.pathname === "/checkout") {
      if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
      if (request.method !== "POST") return new Response(JSON.stringify({ error: "POST only" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      try {
        const body = await request.json();
        if (!Array.isArray(body.items) || body.items.length === 0) return new Response(JSON.stringify({ error: "Cart empty" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const lineItems = [];
        for (const item of body.items) {
          const product = PRODUCTS[item.id];
          if (!product) return new Response(JSON.stringify({ error: "Invalid: " + item.id }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          lineItems.push({ name: product.name, quantity: String(item.quantity || 1), base_price_money: { amount: product.price, currency: "USD" } });
        }
        lineItems.push({ name: SHIPPING.name, quantity: "1", base_price_money: { amount: SHIPPING.price, currency: "USD" } });
        const order = { location_id: LOCATION_ID, line_items: lineItems };
        const res = await fetch(SQUARE_API, {
          method: "POST",
          headers: { "Square-Version": "2026-08-19", "Authorization": "Bearer " + env.SQUARE_ACCESS_TOKEN, "Content-Type": "application/json" },
          body: JSON.stringify({ idempotency_key: crypto.randomUUID(), order: order, checkout_options: { ask_for_shipping_address: true } })
        });
        const result = await res.json();
        if (!res.ok) return new Response(JSON.stringify({ error: "Square error", details: result.errors || [] }), { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const checkoutUrl = result?.payment_link?.long_url || result?.payment_link?.url;
        if (!checkoutUrl) return new Response(JSON.stringify({ error: "No checkout URL" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ success: true, checkout_url: checkoutUrl }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (e) {
        return new Response(JSON.stringify({ error: "Checkout failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }
    return env.ASSETS.fetch(request);
  }
};
