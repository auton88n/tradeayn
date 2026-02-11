/**
 * Shared Apify helper for Twitter scraping.
 * Uses Apify's Twitter Scraper actor via REST API.
 */

const APIFY_BASE = 'https://api.apify.com/v2';

interface TweetResult {
  id?: string;
  text?: string;
  full_text?: string;
  favorite_count?: number;
  retweet_count?: number;
  reply_count?: number;
  impression_count?: number;
  created_at?: string;
  user?: { screen_name?: string };
}

interface ProfileResult {
  screen_name?: string;
  name?: string;
  followers_count?: number;
  following_count?: number;
  description?: string;
  verified?: boolean;
  statuses_count?: number;
}

export interface ScrapedTweet {
  tweet_id: string;
  content: string;
  likes: number;
  retweets: number;
  replies: number;
  impressions: number;
  posted_at: string | null;
  author: string;
}

export interface ScrapedProfile {
  handle: string;
  name: string;
  followers: number;
  following: number;
  bio: string;
  tweet_count: number;
}

/**
 * Scrape recent tweets from a Twitter user via Apify.
 */
export async function scrapeUserTweets(
  handle: string,
  count: number = 20,
  apiToken?: string
): Promise<ScrapedTweet[]> {
  const token = apiToken || Deno.env.get('APIFY_API_TOKEN');
  if (!token) throw new Error('APIFY_API_TOKEN not configured');

  const cleanHandle = handle.replace('@', '').trim();

  try {
    // Use the apidojo/tweet-scraper actor (or similar available actor)
    const res = await fetch(`${APIFY_BASE}/acts/quacker~twitter-scraper/run-sync-get-dataset-items?token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        searchTerms: [`from:${cleanHandle}`],
        maxTweets: count,
        sort: 'Latest',
      }),
    });

    if (!res.ok) {
      // Try alternative actor
      return await scrapeWithAlternativeActor(cleanHandle, count, token);
    }

    const data: TweetResult[] = await res.json();
    return data.map(t => ({
      tweet_id: t.id || '',
      content: t.full_text || t.text || '',
      likes: t.favorite_count || 0,
      retweets: t.retweet_count || 0,
      replies: t.reply_count || 0,
      impressions: t.impression_count || 0,
      posted_at: t.created_at || null,
      author: t.user?.screen_name || cleanHandle,
    }));
  } catch (e) {
    console.error(`Apify scrape failed for @${cleanHandle}:`, e);
    return [];
  }
}

async function scrapeWithAlternativeActor(
  handle: string, count: number, token: string
): Promise<ScrapedTweet[]> {
  try {
    const res = await fetch(`${APIFY_BASE}/acts/apidojo~tweet-scraper/run-sync-get-dataset-items?token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        handle: [handle],
        tweetsDesired: count,
      }),
    });

    if (!res.ok) {
      console.error('Alternative actor also failed:', res.status);
      return [];
    }

    const data: any[] = await res.json();
    return data.map(t => ({
      tweet_id: t.id_str || t.id || '',
      content: t.full_text || t.text || '',
      likes: t.favorite_count || t.likes || 0,
      retweets: t.retweet_count || t.retweets || 0,
      replies: t.reply_count || t.replies || 0,
      impressions: t.impression_count || 0,
      posted_at: t.created_at || null,
      author: handle,
    }));
  } catch (e) {
    console.error('Alternative scraper failed:', e);
    return [];
  }
}

/**
 * Scrape a Twitter user's profile info via Apify.
 */
export async function scrapeUserProfile(
  handle: string,
  apiToken?: string
): Promise<ScrapedProfile | null> {
  const token = apiToken || Deno.env.get('APIFY_API_TOKEN');
  if (!token) throw new Error('APIFY_API_TOKEN not configured');

  const cleanHandle = handle.replace('@', '').trim();

  try {
    const res = await fetch(`${APIFY_BASE}/acts/quacker~twitter-scraper/run-sync-get-dataset-items?token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        getFollowers: false,
        getFollowing: false,
        getRetweeters: false,
        handles: [cleanHandle],
        maxTweets: 1,
        profilesDesired: 1,
      }),
    });

    if (!res.ok) return null;

    const data: any[] = await res.json();
    if (!data.length) return null;

    const user = data[0].user || data[0];
    return {
      handle: user.screen_name || cleanHandle,
      name: user.name || '',
      followers: user.followers_count || 0,
      following: user.following_count || user.friends_count || 0,
      bio: user.description || '',
      tweet_count: user.statuses_count || 0,
    };
  } catch (e) {
    console.error(`Profile scrape failed for @${cleanHandle}:`, e);
    return null;
  }
}

/**
 * Search tweets by keyword/hashtag.
 */
export async function searchTweets(
  query: string,
  count: number = 20,
  apiToken?: string
): Promise<ScrapedTweet[]> {
  const token = apiToken || Deno.env.get('APIFY_API_TOKEN');
  if (!token) throw new Error('APIFY_API_TOKEN not configured');

  try {
    const res = await fetch(`${APIFY_BASE}/acts/quacker~twitter-scraper/run-sync-get-dataset-items?token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        searchTerms: [query],
        maxTweets: count,
        sort: 'Top',
      }),
    });

    if (!res.ok) return [];

    const data: any[] = await res.json();
    return data.map(t => ({
      tweet_id: t.id || '',
      content: t.full_text || t.text || '',
      likes: t.favorite_count || 0,
      retweets: t.retweet_count || 0,
      replies: t.reply_count || 0,
      impressions: t.impression_count || 0,
      posted_at: t.created_at || null,
      author: t.user?.screen_name || '',
    }));
  } catch (e) {
    console.error(`Tweet search failed for "${query}":`, e);
    return [];
  }
}
