import { NextResponse } from "next/server";
import webpush from "web-push";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT;

    if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
      return NextResponse.json(
        { error: "VAPID configuration is missing." },
        { status: 500 },
      );
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const supabase = createSupabaseServerClient();

    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth");

    if (error) {
      throw new Error(`Failed to load subscriptions: ${error.message}`);
    }

    let sentCount = 0;
    let failedCount = 0;

    for (const subscription of subscriptions ?? []) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          JSON.stringify({
            title: "Sync24",
            body: "Push notifications are working! 🚀",
            url: "/",
          }),
        );

        sentCount++;
      } catch (error) {
        failedCount++;

        console.error(`[PUSH TEST] Failed for ${subscription.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      subscriptionCount: subscriptions?.length ?? 0,
      sentCount,
      failedCount,
    });
  } catch (error) {
    console.error("[PUSH TEST] Failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to send test notification.",
      },
      { status: 500 },
    );
  }
}
