import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const trackingId = url.searchParams.get("id");

    if (!trackingId) {
      // Retorna pixel transparente mesmo sem ID
      return new Response(
        new Uint8Array([
          0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80,
          0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 0xf9, 0x04,
          0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01,
          0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b,
        ]),
        {
          headers: {
            "Content-Type": "image/gif",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Buscar email log pelo tracking ID
    const { data: emailLog } = await supabaseClient
      .from("email_logs")
      .select("id, opened_at")
      .eq("metadata->tracking_pixel_id", trackingId)
      .maybeSingle();

    if (emailLog && !emailLog.opened_at) {
      // Primeira abertura
      await supabaseClient
        .from("email_logs")
        .update({
          status: "opened",
          opened_at: new Date().toISOString(),
        })
        .eq("id", emailLog.id);

      console.log("Email aberto:", emailLog.id);
    }

    // Retorna pixel transparente 1x1 GIF
    return new Response(
      new Uint8Array([
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80,
        0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 0xf9, 0x04,
        0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01,
        0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b,
      ]),
      {
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Erro no tracking:", error);
    // Sempre retorna pixel mesmo em erro
    return new Response(
      new Uint8Array([
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80,
        0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 0xf9, 0x04,
        0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01,
        0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b,
      ]),
      {
        headers: {
          "Content-Type": "image/gif",
        },
      }
    );
  }
});