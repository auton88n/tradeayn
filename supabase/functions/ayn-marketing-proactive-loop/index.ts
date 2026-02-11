import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { scrapeUserTweets, scrapeUserProfile } from "../_shared/apifyHelper.ts";
import { logAynActivity } from "../_shared/aynLogger.ts";
import { sendTelegramMessage } from "../_shared/telegramHelper.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  const APIFY_TOKEN = Deno.env.get('APIFY_API_TOKEN');
  const MKT_BOT_TOKEN = Deno.env.get('TELEGRAM_MARKETING_BOT_TOKEN');
  const MKT_CHAT_ID = Deno.env.get('TELEGRAM_MARKETING_CHAT_ID');
  const ADMIN_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const ADMIN_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID');

  const report: string[] = [];
  const errors: string[] = [];

  try {
    console.log('[MARKETING-LOOP] Starting autonomous cycle...');

    // ─── 1. Scrape our Twitter account ───
    let ourTweets: any[] = [];
    let ourProfile: any = null;
    if (APIFY_TOKEN) {
      try {
        // Get our handle from ayn_mind or default
        const { data: handleData } = await supabase
          .from('ayn_mind')
          .select('content')
          .eq('type', 'config_twitter_handle')
          .limit(1);
        const ourHandle = handleData?.[0]?.content || 'aaborashed';

        ourProfile = await scrapeUserProfile(ourHandle, APIFY_TOKEN);
        ourTweets = await scrapeUserTweets(ourHandle, 10, APIFY_TOKEN);

        if (ourProfile) {
          report.push(`📊 our twitter (@${ourHandle}): ${ourProfile.followers} followers, ${ourProfile.tweet_count} tweets`);
        }

        if (ourTweets.length > 0) {
          // Update twitter_posts with real engagement data
          for (const tweet of ourTweets) {
            if (tweet.tweet_id) {
              await supabase.from('twitter_posts').upsert({
                content: tweet.content?.slice(0, 280),
                status: 'posted',
                impressions: tweet.impressions,
                likes: tweet.likes,
                retweets: tweet.retweets,
                replies: tweet.replies,
              }, { onConflict: 'content', ignoreDuplicates: true }).select();
            }
          }

          const topTweet = ourTweets.sort((a, b) => b.likes - a.likes)[0];
          if (topTweet) {
            report.push(`🔥 best recent: "${topTweet.content?.slice(0, 60)}..." (${topTweet.likes} likes, ${topTweet.retweets} RTs)`);
          }
          const avgLikes = Math.round(ourTweets.reduce((s, t) => s + t.likes, 0) / ourTweets.length);
          report.push(`📈 avg engagement: ${avgLikes} likes/post`);
        } else {
          report.push('⚠️ couldn\'t pull our tweets this cycle');
        }
      } catch (e) {
        errors.push(`twitter scrape: ${e instanceof Error ? e.message : 'failed'}`);
      }
    } else {
      report.push('⚠️ apify not configured — skipping twitter scrape');
    }

    // ─── 2. Scrape competitors ───
    let competitorInsights: string[] = [];
    if (APIFY_TOKEN) {
      try {
        const { data: competitors } = await supabase
          .from('marketing_competitors')
          .select('*')
          .eq('is_active', true);

        if (competitors?.length) {
          for (const comp of competitors) {
            try {
              const tweets = await scrapeUserTweets(comp.handle, 10, APIFY_TOKEN);
              if (tweets.length > 0) {
                // Save competitor tweets
                for (const t of tweets) {
                  await supabase.from('competitor_tweets').upsert({
                    competitor_id: comp.id,
                    tweet_id: t.tweet_id,
                    content: t.content?.slice(0, 2000),
                    likes: t.likes,
                    retweets: t.retweets,
                    replies: t.replies,
                    impressions: t.impressions,
                    posted_at: t.posted_at,
                  }, { onConflict: 'tweet_id', ignoreDuplicates: true });
                }

                const topTweet = tweets.sort((a, b) => b.likes - a.likes)[0];
                const avgEng = Math.round(tweets.reduce((s, t) => s + t.likes, 0) / tweets.length);
                competitorInsights.push(`@${comp.handle}: top "${topTweet?.content?.slice(0, 50)}..." (${topTweet?.likes} likes), avg ${avgEng} likes`);

                // Update last scraped
                await supabase.from('marketing_competitors')
                  .update({ last_scraped_at: new Date().toISOString() })
                  .eq('id', comp.id);
              }
            } catch (e) {
              errors.push(`competitor @${comp.handle}: ${e instanceof Error ? e.message : 'failed'}`);
            }
          }

          if (competitorInsights.length > 0) {
            report.push(`\n👀 competitors:\n${competitorInsights.join('\n')}`);
          }
        } else {
          report.push('no competitors tracked yet — tell me who to watch');
        }
      } catch (e) {
        errors.push(`competitor scan: ${e instanceof Error ? e.message : 'failed'}`);
      }
    }

    // ─── 3. AI Analysis + Content Generation ───
    if (LOVABLE_API_KEY && (ourTweets.length > 0 || competitorInsights.length > 0)) {
      try {
        const analysisPrompt = buildAnalysisPrompt(ourTweets, competitorInsights, ourProfile);
        
        const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'google/gemini-3-flash-preview',
            messages: [
              { role: 'system', content: ANALYSIS_PERSONA },
              { role: 'user', content: analysisPrompt },
            ],
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const analysis = aiData.choices?.[0]?.message?.content || '';

          // Extract tweet drafts from analysis
          const drafts = extractDrafts(analysis);
          for (const draft of drafts) {
            await supabase.from('twitter_posts').insert({
              content: draft.slice(0, 280),
              status: 'pending_review',
              created_by_name: 'marketing_bot',
              content_type: 'single',
              target_audience: 'general',
            });
          }

          if (drafts.length > 0) {
            report.push(`\n✍️ created ${drafts.length} draft(s) for review`);
            for (let i = 0; i < drafts.length; i++) {
              report.push(`  ${i + 1}. "${drafts[i].slice(0, 80)}..."`);
            }
          }

          // Save analysis to memory
          await supabase.from('ayn_mind').insert({
            type: 'marketing_analysis',
            content: analysis.slice(0, 4000),
            context: { 
              source: 'proactive_loop',
              our_tweets: ourTweets.length,
              competitors_analyzed: competitorInsights.length,
              drafts_created: drafts.length,
            },
            shared_with_admin: true,
          });

          // Extract strategic insight for the report
          const insightMatch = analysis.match(/(?:insight|strategy|recommendation|takeaway)[:\s]*(.{50,200})/i);
          if (insightMatch) {
            report.push(`\n💡 ${insightMatch[1].trim()}`);
          }
        }
      } catch (e) {
        errors.push(`ai analysis: ${e instanceof Error ? e.message : 'failed'}`);
      }
    }

    // ─── 4. Auto-generate a branded image ───
    if (LOVABLE_API_KEY && ourTweets.length > 0) {
      try {
        // Find a strong hook to visualize
        const hookRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'google/gemini-3-flash-preview',
            messages: [{
              role: 'user',
              content: `Based on these recent tweets, give me ONE 3-word phrase that would make a killer branded image (black/white with blue accent). Just the 3 words, nothing else.\n\nTweets:\n${ourTweets.map(t => t.content).join('\n')}`,
            }],
          }),
        });

        if (hookRes.ok) {
          const hookData = await hookRes.json();
          const hook = hookData.choices?.[0]?.message?.content?.trim();

          if (hook && hook.split(/\s+/).length <= 5) {
            // Generate image
            const imgRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: 'google/gemini-3-pro-image-preview',
                messages: [{
                  role: 'user',
                  content: `Create a bold 1080x1080 social media image. Pure black background. The text "${hook}" centered in massive white bold sans-serif font. One word highlighted in electric blue (#0EA5E9). Minimal, high-contrast, premium feel. No other elements.`,
                }],
                modalities: ['image', 'text'],
              }),
            });

            if (imgRes.ok) {
              const imgData = await imgRes.json();
              const imageUrl = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

              if (imageUrl) {
                // Upload to storage
                const base64Match = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
                if (base64Match) {
                  const binaryData = Uint8Array.from(atob(base64Match[2]), c => c.charCodeAt(0));
                  const filename = `marketing-auto-${Date.now()}.${base64Match[1]}`;

                  await supabase.storage.from('generated-images')
                    .upload(filename, binaryData, { contentType: `image/${base64Match[1]}` });

                  const { data: publicUrlData } = supabase.storage.from('generated-images').getPublicUrl(filename);

                  // Save as draft
                  await supabase.from('twitter_posts').insert({
                    content: hook,
                    status: 'pending_review',
                    created_by_name: 'marketing_bot',
                    image_url: publicUrlData.publicUrl,
                    content_type: 'image',
                  });

                  report.push(`\n🎨 auto-generated image: "${hook}"`);

                  // Send to marketing chat
                  if (MKT_BOT_TOKEN && MKT_CHAT_ID) {
                    await fetch(`https://api.telegram.org/bot${MKT_BOT_TOKEN}/sendPhoto`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        chat_id: MKT_CHAT_ID,
                        photo: publicUrlData.publicUrl,
                        caption: `🎨 auto-generated this: "${hook}"\napprove it or tell me to tweak`,
                      }),
                    });
                  }
                }
              }
            }
          }
        }
      } catch (e) {
        errors.push(`image gen: ${e instanceof Error ? e.message : 'failed'}`);
      }
    }

    // ─── 5. Website health check ───
    try {
      const siteUrl = 'https://ayn-insight-forge.lovable.app';
      const start = Date.now();
      const siteRes = await fetch(siteUrl, { method: 'HEAD' });
      const responseTime = Date.now() - start;

      if (siteRes.ok) {
        report.push(`\n🌐 site is up (${responseTime}ms)`);
      } else {
        report.push(`\n🚨 site returned ${siteRes.status} (${responseTime}ms)`);
      }
    } catch (e) {
      report.push(`\n🚨 site is DOWN: ${e instanceof Error ? e.message : 'unreachable'}`);
    }

    // ─── 6. Send report ───
    if (errors.length > 0) {
      report.push(`\n⚠️ issues this cycle:\n${errors.join('\n')}`);
    }

    const fullReport = `hey, just ran my check —\n\n${report.join('\n')}`;

    // Send to marketing chat
    if (MKT_BOT_TOKEN && MKT_CHAT_ID) {
      await sendTelegramMessage(MKT_BOT_TOKEN, MKT_CHAT_ID, fullReport);
    }

    // Also notify admin
    if (ADMIN_BOT_TOKEN && ADMIN_CHAT_ID) {
      await sendTelegramMessage(ADMIN_BOT_TOKEN, ADMIN_CHAT_ID, `📣 marketing loop update:\n\n${report.join('\n')}`);
    }

    // Log activity
    await logAynActivity(supabase, 'marketing_proactive_loop', fullReport.slice(0, 500), {
      target_type: 'marketing',
      details: {
        our_tweets_scraped: ourTweets.length,
        competitors_analyzed: competitorInsights.length,
        errors: errors.length,
      },
      triggered_by: 'cron',
    });

    // Save to memory
    await supabase.from('ayn_mind').insert({
      type: 'marketing_ayn',
      content: fullReport.slice(0, 4000),
      context: { source: 'proactive_loop', cycle_time: new Date().toISOString() },
      shared_with_admin: true,
    });

    console.log('[MARKETING-LOOP] Cycle complete.');
    return new Response(JSON.stringify({ success: true, report: report.join('\n') }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[MARKETING-LOOP] Fatal error:', error);
    return new Response(JSON.stringify({ error: 'Loop failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ─── Analysis persona ───
const ANALYSIS_PERSONA = `You're AYN's marketing brain. Analyze the data and do three things:
1. Identify what's working and what's not (engagement patterns, best hooks, timing)
2. Spot gaps vs competitors — what are they doing that we're not?
3. Draft 1-2 tweet ideas based on your analysis. Each must be under 280 chars.

Format your drafts like:
DRAFT: "tweet text here"

Be direct, no fluff. Think like a strategist, write like a creator.`;

function buildAnalysisPrompt(
  ourTweets: any[],
  competitorInsights: string[],
  profile: any
): string {
  let prompt = '';

  if (profile) {
    prompt += `Our account: @${profile.handle}, ${profile.followers} followers\n\n`;
  }

  if (ourTweets.length > 0) {
    prompt += `Our recent tweets:\n`;
    for (const t of ourTweets) {
      prompt += `- "${t.content?.slice(0, 100)}" (${t.likes}❤️ ${t.retweets}🔁 ${t.replies}💬)\n`;
    }
  }

  if (competitorInsights.length > 0) {
    prompt += `\nCompetitor data:\n${competitorInsights.join('\n')}\n`;
  }

  prompt += `\nWhat should we do differently? Give me actionable insights and 1-2 tweet drafts.`;
  return prompt;
}

function extractDrafts(analysis: string): string[] {
  const drafts: string[] = [];
  const matches = analysis.matchAll(/DRAFT:\s*"([^"]{10,280})"/g);
  for (const m of matches) {
    drafts.push(m[1].trim());
  }
  return drafts;
}
