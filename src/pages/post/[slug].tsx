import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: Post) {
  return (
    <h1>teste</h1>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  //const posts = await prismic.query(TODO);

  return {
    paths: [],
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug }  = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {});

  const post = {
    first_publication_date: response.first_publication_date,
    data: {
      title: RichText.asText(response.data.title),
      banner: {
        url: RichText.asText(response.data.banner.url),
      },
      author: response.data.author,
      content: {
        heading: RichText.asHtml(response.data.content.heading),
        body: {
          text: RichText.asHtml(response.data.content.body),
        }[],
      }[],
    },
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 60, // 1 hour
  };
};
