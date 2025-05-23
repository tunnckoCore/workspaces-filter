const SYNDICATION_URL = 'https://cdn.syndication.twimg.com';

export class TwitterApiError extends Error {
  status: number;
  data: any;

  constructor({ data, message, status }: { message: string; status: number; data: any }) {
    super(message);
    this.name = 'TwitterApiError';
    this.status = status;
    this.data = data;
  }
}

const TWEET_ID = /^\d+$/;

function getToken(id: string) {
  // eslint-disable-next-line prefer-named-capture-group
  return ((Number(id) / 1e15) * Math.PI).toString(6 ** 2).replace(/(0+|\.)/g, '');
}

/**
 * Fetches a tweet from the Twitter syndication API.
 */
export async function fetchTweet(
  id: string,
  fetchOptions?: RequestInit,
): Promise<{ data?: any; tombstone?: true; notFound?: true; error?: TwitterApiError }> {
  if (id.length > 40 || !TWEET_ID.test(id)) {
    throw new Error(`Invalid tweet id: ${id}`);
  }

  const url = new URL(`${SYNDICATION_URL}/tweet-result`);

  url.searchParams.set('id', id);
  url.searchParams.set('lang', 'en');
  url.searchParams.set(
    'features',
    [
      'tfw_timeline_list:',
      'tfw_follower_count_sunset:true',
      'tfw_tweet_edit_backend:on',
      'tfw_refsrc_session:on',
      'tfw_fosnr_soft_interventions_enabled:on',
      'tfw_show_birdwatch_pivots_enabled:on',
      'tfw_show_business_verified_badge:on',
      'tfw_duplicate_scribes_to_settings:on',
      'tfw_use_profile_image_shape_enabled:on',
      'tfw_show_blue_verified_badge:on',
      'tfw_legacy_timeline_sunset:true',
      'tfw_show_gov_verified_badge:on',
      'tfw_show_business_affiliate_badge:on',
      'tfw_tweet_edit_frontend:on',
    ].join(';'),
  );
  url.searchParams.set('token', getToken(id));

  console.log(`Fetching tweet from ${url}`);

  const res = await fetch(url.toString(), fetchOptions);
  const isJson = res.headers.get('content-type')?.includes('application/json');
  // eslint-disable-next-line no-undefined
  const data = isJson ? await res.json() : undefined;

  if (res.ok) {
    if (data?.__typename === 'TweetTombstone') {
      return { tombstone: true };
    }
    return { data };
  }
  if (res.status === 404) {
    return { notFound: true };
  }

  return {
    error: new TwitterApiError({
      data,
      message:
        typeof data.error === 'string'
          ? data.error
          : `Failed to fetch tweet at "${url}" with "${res.status}".`,
      status: res.status,
    }),
  };
}

// bun post 1918626375596224834
// wgw_lol bun reply 1918688486510465293
const result = await fetchTweet('1918843428093206756');

console.log(JSON.stringify(result, null, 2));
