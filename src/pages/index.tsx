import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import Translate, {translate} from '@docusaurus/Translate';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">
          <Translate id="homepage.tagline">
            Documentación Técnica y Arquitectura de ClínicaRed
          </Translate>
        </p>
        <div className={styles.buttons}>
          <Link
            className={clsx('button button--lg', styles.ctaButton)}
            to="/docs/problema-original">
            <Translate id="homepage.cta">
              Ver el Problema Original
            </Translate>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${translate({id: 'homepage.title', message: 'Inicio'})} - ${siteConfig.title}`}
      description={translate({
        id: 'homepage.description',
        message: 'Documentación Técnica y Arquitectura de ClínicaRed',
      })}>
      <HomepageHeader />
      <main>
        {/* Espacio reservado para Power BI */}
      </main>
    </Layout>
  );
}