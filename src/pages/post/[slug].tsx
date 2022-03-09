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
  formatted_first_publication_date: string | null;
  formatted_last_publication_date: string | null;
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

interface RelatedPost {
  uid: string;
  data: {
    title: string;
  }
}

interface PostProps {
  post: Post;
  nextPost?: RelatedPost;
  prevPost?: RelatedPost;
  readingTime: number;
  preview?: boolean;
  isPostEdited: boolean;
  isThereRelatedPost: boolean;
}

export default function Post({ post, isPostEdited, nextPost, prevPost, isThereRelatedPost, readingTime, preview }: PostProps): JSX.Element {
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
                <mark>{post.formatted_first_publication_date}</mark>
              </span>
              <span>
                <FiUser />
                <mark>{post.data.author}</mark>
              </span>
              <span>
                <FiClock />
                <mark>{readingTime} min</mark>
              </span>

              { isPostEdited && (
                <p>
                  <em>* editado em&nbsp;
                  {post.formatted_last_publication_date}
                  </em>
                </p>
              ) }
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

            { isThereRelatedPost && (
              <div className={styles.relatedPosts}>
                { prevPost && (
                  <Link href={`/post/${prevPost.uid}`}>
                    <a>
                      <span>{prevPost.data.title}</span>
                      <span>Post anterior</span>
                    </a>
                  </Link>
                ) }

                { nextPost && (
                  <Link href={`/post/${nextPost.uid}`}>
                    <a>
                      <span>{nextPost.data.title}</span>
                      <span>Próximo post</span>
                    </a>
                  </Link>
                ) }
              </div>
            ) }
            
            <Comments />

            {preview && (
              <aside>
                <Link href="/api/exit-preview">
                  <a>Sair do modo Preview</a>
                </Link>
              </aside>
            )}
          </article>
        </section>
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

  const nextResponse = await prismic.query(
    // Replace `article` with your doc type
    Prismic.Predicates.at('document.type', 'post'),
    {
      pageSize: 1,
      after: response?.id,
      orderings: '[document.first_publication_date desc]',
    },
  )
  const prevResponse = await prismic.query(
    // Replace `article` with your doc type
    Prismic.Predicates.at('document.type', 'post'),
    {
      pageSize: 1,
      after: response?.id,
      orderings: '[document.first_publication_date]',
    },
  )
  const nextPost = nextResponse?.results[0] || null
  const prevPost = prevResponse?.results[0] || null

  const isThereRelatedPost = nextPost || prevPost

  let readingTime;

  const post = {
    first_publication_date: response.first_publication_date,
    formatted_first_publication_date: format(
      new Date(response.first_publication_date),
      'dd MMM yyyy',
      { locale: ptBR }
    ),
    last_publication_date: response.last_publication_date,
    formatted_last_publication_date: format(
      new Date(response.last_publication_date),
      "dd MMM yyyy, 'às' HH:mm",
      { locale: ptBR }
    ),
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

  const isPostEdited = post.first_publication_date !== post.last_publication_date

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
      preview,
      isPostEdited,
      nextPost,
      prevPost,
      isThereRelatedPost
    },
    revalidate: 60 * 30, // 30 minutos
  };
};
