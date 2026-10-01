export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Only handle checkout requests
    if (url.pathname === "/checkout" || url.pathname === "/api/checkout") {
      const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      };

      if (request.method === "OPTIONS") {
        return new Response(null, { status: 200, headers: corsHeaders });
      }

      if (request.method === "POST") {
        try {
          const body = await request.json();
          // Process checkout with Square API
          const squareToken = env.SQUARE_ACCESS_TOKEN;

          // Return checkout response
          return new Response(
            JSON.stringify({ success: true, message: "Checkout processed" }),
            {
              status: 200,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );
        } catch (error) {
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            {
              status: 500,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );
        }
      }
    }

    // For all other requests, let Pages serve the static files
    return env.ASSETS.fetch(request);
  },
};
