/* eslint-disable prettier/prettier */
/* eslint-disable no-useless-escape */
/* eslint-disable react/no-danger */
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useRouter } from 'next/router';

import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { getPrismicClient } from '../../services/prismic';
import Comments from '../../components/Comments';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Link from 'next/link';

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
  readingTime: number;
  preview?: boolean;
}

export default function Post({ post, readingTime, preview }: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <Head>
        <title>{post.data.title} | SpaceTravaling</title>
      </Head>

      <main>
        {preview && (
          <aside>
            <Link href="/api/exit-preview">
              <a>Sair do modo Preview</a>
            </Link>
          </aside>
        )}

        <section className={styles.banner}>
          <Image
            src={post.data.banner.url}
            alt="Banner"
            width={1440}
            height={400}
          />
        </section>

        <section className={commonStyles.pageContainer}>
          <article className={commonStyles.pageContent}>
            <div className={styles.postHeader}>
              <h2>{post.data.title}</h2>
              <span>
                <FiCalendar />
                <mark>
                  {format(
                    new Date(post.first_publication_date),
                    'dd MMM yyyy',
                    { locale: ptBR }
                  )}
                </mark>
              </span>
              <span>
                <FiUser />
                <mark>{post.data.author}</mark>
              </span>
              <span>
                <FiClock />
                <mark>{readingTime} min</mark>
              </span>
            </div>
            {post.data.content.map(content => (
              <div key={content.heading} className={styles.postContent}>
                <h3>{content.heading}</h3>
                <div
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(content.body),
                  }}
                />
              </div>
            ))}
          </article>
        </section>

        <Comments />
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'post')
  );

  const paths = posts.results.map(uid => ({
    params: { slug: String(uid.uid) },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params, preview = false, previewData }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {
    ref: previewData?.ref ?? null,
  });

  let readingTime;

  const post = {
    first_publication_date: response.first_publication_date,
    uid: response.uid,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
    },
  };

  readingTime = response.data.content
    .map(content => content.heading.split(' ').length)
    .reduce((acc: number, sum: number) => acc + sum);

  readingTime += response.data.content
    .map(content => RichText.asText(content.body).split(' ').length)
    .reduce((acc: number, sum: number) => acc + sum);

    readingTime /= 200;
    readingTime = Math.ceil(readingTime);

  return {
    props: {
      post,
      readingTime,
      preview
    },
    revalidate: 60 * 30, // 30 minutos
  };
};
