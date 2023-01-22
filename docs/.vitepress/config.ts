import mk from "@traptitech/markdown-it-katex";
import { generateSidebar } from "vitepress-sidebar";
import { defineConfig } from "vitepress";

const sidebar = generateSidebar({
  root: "/docs",
  hyphenToSpace: true,
  collapsible: true,
  collapsed: false,
  capitalizeFirst: true,
})[0].items.filter((v) => !(v.text + "").startsWith("_"));

export default defineConfig({
  base: "/blog/",
  locales: {
    root: {
      title: "Stefnotch's Bloggy Blog",
      themeConfig: {
        sidebar: sidebar,
        nav: [
          {
            text: "GitHub Repo",
            link: "https://github.com/stefnotch/stefnotch.github.io",
          },
        ],
      },
      label: "English",
      lang: "en",
    },
  },

  markdown: {
    config: (md) => {
      // use more markdown-it plugins!
      md.use(mk, { throwOnError: false, errorColor: " #cc0000" });

      // https://github.com/Maorey/Blog/blob/ac5ced6deb3bbec689c672ec425640a0fba598f3/docs/.vitepress/config.js#L51

      const mdRender = md.render;
      md.render = function () {
        return mdRender
          .apply(this, arguments)
          .replace(/<span class="katex">/g, '<span v-pre class="katex">');
      };
    },
  },
});
