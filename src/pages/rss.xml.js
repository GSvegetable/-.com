import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = (await getCollection('posts')).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  return rss({
    title: '宫水',
    description: '一处在水边慢慢写的地方。',
    site: context.site ?? 'https://gongshui.com',
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      link: `/notes/${post.id}/`,
    })),
  });
}
