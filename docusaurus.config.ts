import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: "ClínicaRed Docs",
  tagline: "Documentación Técnica y Arquitectura de ClínicaRed",
  favicon: "img/favicon.ico",
  // Activar Mermaid para los diagramas
  markdown: {
    mermaid: true,
  },
  themes: ["@docusaurus/theme-mermaid"],

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: "https://el-eden-riwi.github.io",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/clinicared-docs/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "el-eden-riwi", // Usually your GitHub org/user name.
  projectName: "clinicared-docs", // Usually your repo name.
  trailingSlash: false,

  onBrokenLinks: "throw",

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: "https://github.com/el-eden-riwi/clinicared-docs/tree/main/",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: "img/docusaurus-social-card.jpg",
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: "ClínicaRed",
      logo: {
        alt: "My Site Logo",
        src: "img/logo.svg",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "tutorialSidebar",
          position: "left",
          label: "Documentación",
        },
        {
          to: "/docs/problema-original",
          label: "El Problema",
          position: "left",
        },
        {
          href: "https://github.com/el-eden-riwi",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Documentación",
          items: [
            {
              label: "Arquitectura",
              to: "/docs/architecture/architecture_v1",
            },
            {
              label: "Repositorio GitHub",
              href: "https://github.com/el-eden-riwi/clinicared-docs",
            },
          ],
        },
        {
          title: "Equipo de Desarrollo",
          items: [
            {
              // Inyectamos HTML; el estilo vive en src/css/custom.css (.crTeam)
              html: `
                <div class="crTeam">
                  <!-- Integrante 1: Jeas -->
                  <a class="crTeam__member" href="https://github.com/jhonnyelithAZ" target="_blank">
                    <img class="crTeam__avatar" src="https://github.com/jhonnyelithAZ.png" alt="Jeas" />
                    <strong class="crTeam__name">Jhonatan Ayala S. (Jeas)</strong>
                  </a>

                  <!-- Integrante 2 -->
                  <a class="crTeam__member" href="https://github.com/HCHLyan" target="_blank">
                    <img class="crTeam__avatar" src="https://github.com/HCHLyan.png" alt="Lyan" />
                    <strong class="crTeam__name">Lyan Víctor Páez Arévalo</strong>
                  </a>

                  <!-- Integrante 3 -->
                  <a class="crTeam__member" href="https://github.com/IRoviraRomario" target="_blank">
                    <img class="crTeam__avatar" src="https://github.com/IRoviraRomario.png" alt="Romario" />
                    <strong class="crTeam__name">Kevin Romario Rovira Iglesias</strong>
                  </a>
                </div>
              `,
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} ClínicaRed. Construido en Riwi.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
