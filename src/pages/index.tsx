import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
<<<<<<< HEAD
            className={clsx('button button--lg', styles.ctaButton)}
            to="/docs/problema-original">
            Ver el Problema Original
=======
            className="button button--secondary button--lg"
            to="/docs/problema-original">
            Ver el Problema Original 🚀
>>>>>>> 38ac9959b3452f8c96425bab5db223a4b2fca4fb
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
      title={`Inicio - ${siteConfig.title}`}
      description="Documentación Técnica y Arquitectura de ClínicaRed">
      <HomepageHeader />
      <main>
        {/* Espacio reservado para Power BI */}
      </main>
    </Layout>
  );
}