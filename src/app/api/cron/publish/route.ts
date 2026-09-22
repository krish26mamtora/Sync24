import { NextResponse } from "next/server";
import webpush from "web-push";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getIndiaDate } from "@/lib/utils/date";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // --------------------------------------------------
    // 1. Verify cron secret
    // --------------------------------------------------

    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("[CRON PUBLISH] CRON_SECRET is not configured.");

      return NextResponse.json(
        { error: "Cron secret is not configured." },
        { status: 500 },
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const editionDate = getIndiaDate();

    console.log(`[CRON PUBLISH] Publishing edition for ${editionDate}`);

    const supabase = createSupabaseServerClient();

    // --------------------------------------------------
    // 2. Find today's processing edition
    // --------------------------------------------------

    const { data: edition, error: editionError } = await supabase
      .from("daily_editions")
      .select("*")
      .eq("edition_date", editionDate)
      .maybeSingle();

    if (editionError) {
      throw new Error(
        `Failed to find today's edition: ${editionError.message}`,
      );
    }

    if (!edition) {
      return NextResponse.json(
        {
          success: false,
          error: "Today's edition has not been prepared yet.",
          editionDate,
        },
        { status: 404 },
      );
    }

    // Already published → safe/idempotent response.
    if (edition.status === "published") {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "Today's edition is already published.",
        editionId: edition.id,
        editionDate,
      });
    }

    if (edition.status !== "processing") {
      return NextResponse.json(
        {
          success: false,
          error: `Edition is not ready for publishing. Current status: ${edition.status}`,
          editionId: edition.id,
        },
        { status: 409 },
      );
    }

    // --------------------------------------------------
    // 3. Verify exactly 10 articles
    // --------------------------------------------------

    const { data: articles, error: articlesError } = await supabase
      .from("news_articles")
      .select("id, rank, title")
      .eq("edition_id", edition.id)
      .eq("is_selected", true)
      .order("rank", { ascending: true });

    if (articlesError) {
      throw new Error(
        `Failed to load edition articles: ${articlesError.message}`,
      );
    }

    if (!articles || articles.length !== 10) {
      return NextResponse.json(
        {
          success: false,
          error: "Edition does not contain exactly 10 selected articles.",
          editionId: edition.id,
          articleCount: articles?.length ?? 0,
        },
        { status: 422 },
      );
    }

    // --------------------------------------------------
    // 4. Mark edition as published
    // --------------------------------------------------

    const publishedAt = new Date();
    const expiresAt = new Date(publishedAt.getTime() + 24 * 60 * 60 * 1000);

    const { data: publishedEdition, error: publishError } = await supabase
      .from("daily_editions")
      .update({
        status: "published",
        published_at: publishedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .eq("id", edition.id)
      .eq("status", "processing")
      .select()
      .single();

    if (publishError) {
      throw new Error(`Failed to publish edition: ${publishError.message}`);
    }

    console.log(`[CRON PUBLISH] Edition ${publishedEdition.id} published.`);

    // --------------------------------------------------
    // 5. Configure Web Push
    // --------------------------------------------------

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT;

    if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
      console.error("[CRON PUBLISH] VAPID configuration is missing.");

      return NextResponse.json({
        success: true,
        editionId: publishedEdition.id,
        articleCount: articles.length,
        notificationSent: false,
        warning: "Edition published, but VAPID configuration is missing.",
      });
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    // --------------------------------------------------
    // 6. Get all subscriptions
    // --------------------------------------------------

    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth");

    if (subscriptionsError) {
      throw new Error(
        `Failed to load push subscriptions: ${subscriptionsError.message}`,
      );
    }

    let sentCount = 0;
    let failedCount = 0;

    // --------------------------------------------------
    // 7. Send notification to every subscriber
    // --------------------------------------------------

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
            body: "Today's top 10 tech stories are ready",
            url: "/",
          }),
        );

        sentCount++;
      } catch (error) {
        failedCount++;

        console.error(
          `[CRON PUBLISH] Push failed for subscription ${subscription.id}:`,
          error,
        );

        // 404/410 usually means the browser subscription is no longer valid.
        const statusCode =
          error && typeof error === "object" && "statusCode" in error
            ? (error as { statusCode?: number }).statusCode
            : undefined;

        if (statusCode === 404 || statusCode === 410) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("id", subscription.id);
        }
      }
    }

    console.log(
      `[CRON PUBLISH] Notifications: ${sentCount} sent, ${failedCount} failed.`,
    );

    return NextResponse.json({
      success: true,
      editionId: publishedEdition.id,
      editionDate,
      articleCount: articles.length,
      notificationSent: true,
      subscriptionCount: subscriptions?.length ?? 0,
      sentCount,
      failedCount,
    });
  } catch (error) {
    console.error("[CRON PUBLISH] Failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to publish today's edition.",
      },
      { status: 500 },
    );
  }
}
