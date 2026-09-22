import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface PushSubscriptionRequest {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PushSubscriptionRequest;

    if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
      return NextResponse.json(
        {
          error: "Invalid push subscription.",
        },
        { status: 400 },
      );
    }

    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("push_subscriptions")
      .upsert(
        {
          endpoint: body.endpoint,
          p256dh: body.keys.p256dh,
          auth: body.keys.auth,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "endpoint",
        },
      )
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save push subscription: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      subscriptionId: data.id,
    });
  } catch (error) {
    console.error("[PUSH SUBSCRIBE] Failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to subscribe for notifications.",
      },
      { status: 500 },
    );
  }
}
