/* eslint-disable no-alert */
import Head from 'next/head';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { useState } from 'react';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import Prismic from '@prismicio/client';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [content, setContent] = useState(postsPagination);

  const loadMorePosts = (): void => {
    const url = content.next_page;

    if (url !== null) {
      fetch(content.next_page)
        .then(response => response.json())
        .then(data => {
          const newList = content.results.concat(data.results);

          setContent({
            next_page: data.next_page,
            results: newList,
          });
        })
        .catch(err => {
          alert(`Something went wrong! Error.: ${err.message}`);
        });
    }
  };

  return (
    <>
      <Head>
        <title>Home | SpaceTravaling</title>
      </Head>

      <main className={commonStyles.pageContainer}>
        <section className={commonStyles.pageContent}>
          {content.results.length ? (
            content.results.map(post => (
              <article className={styles.postCard} key={post.uid}>
                <Link href={`/post/${post.uid}`}>
                  <a>
                    <h2>{post.data.title}</h2>
                    <h3>{post.data.subtitle}</h3>
                    <div>
                      <span>
                        <FiCalendar />
                        {format(
                          new Date(post.first_publication_date),
                          'dd MMM yyyy',
                          {
                            locale: ptBR,
                          }
                        )}
                      </span>
                      <span>
                        <FiUser />
                        {post.data.author}
                      </span>
                    </div>
                  </a>
                </Link>
              </article>
            ))
          ) : (
            <p>Nenhuma publicação encontrada!</p>
          )}

          {content.next_page && (
            <button
              className={styles.loadMore}
              type="button"
              onClick={loadMorePosts}
            >
              Carregar mais posts
            </button>
          )}
        </section>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    { pageSize: 1 }
  );

  const results = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const { next_page } = postsResponse;

  const postsPagination = { results, next_page };

  // TODO
  return {
    props: {
      postsPagination,
    },
  };
};
