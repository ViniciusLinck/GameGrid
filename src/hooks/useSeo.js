import { useEffect } from "react";

const SITE_URL = "https://viniciuslinck.github.io/GameGrid";
const DEFAULT_IMAGE = `${SITE_URL}/favicon.svg`;
const DEFAULT_TITLE = "GameGrid | Copa do Mundo 2026";
const DEFAULT_DESCRIPTION =
  "Calendario da Copa do Mundo 2026 com jogos, fases, detalhes de times e jogadores.";

function upsertMeta(selector, attributes) {
  let node = document.head.querySelector(selector);
  if (!node) {
    node = document.createElement("meta");
    document.head.appendChild(node);
  }
  Object.entries(attributes).forEach(([key, value]) => {
    node.setAttribute(key, value);
  });
}

function upsertLink(rel, href) {
  let node = document.head.querySelector(`link[rel='${rel}']`);
  if (!node) {
    node = document.createElement("link");
    node.setAttribute("rel", rel);
    document.head.appendChild(node);
  }
  node.setAttribute("href", href);
}

function upsertJsonLd(jsonLd) {
  const id = "seo-json-ld";
  let node = document.head.querySelector(`#${id}`);
  if (!node) {
    node = document.createElement("script");
    node.setAttribute("id", id);
    node.setAttribute("type", "application/ld+json");
    document.head.appendChild(node);
  }
  node.textContent = JSON.stringify(jsonLd);
}

function removeJsonLd() {
  const node = document.head.querySelector("#seo-json-ld");
  if (node) {
    node.remove();
  }
}

export function useSeo({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  image = DEFAULT_IMAGE,
  type = "website",
  robots = "index,follow",
  jsonLd,
} = {}) {
  useEffect(() => {
    const canonicalUrl = `${SITE_URL}${path}`;
    document.title = title;

    upsertMeta("meta[name='description']", {
      name: "description",
      content: description,
    });
    upsertMeta("meta[name='robots']", {
      name: "robots",
      content: robots,
    });
    upsertMeta("meta[property='og:type']", {
      property: "og:type",
      content: type,
    });
    upsertMeta("meta[property='og:site_name']", {
      property: "og:site_name",
      content: "GameGrid",
    });
    upsertMeta("meta[property='og:title']", {
      property: "og:title",
      content: title,
    });
    upsertMeta("meta[property='og:description']", {
      property: "og:description",
      content: description,
    });
    upsertMeta("meta[property='og:url']", {
      property: "og:url",
      content: canonicalUrl,
    });
    upsertMeta("meta[property='og:image']", {
      property: "og:image",
      content: image,
    });
    upsertMeta("meta[name='twitter:card']", {
      name: "twitter:card",
      content: "summary_large_image",
    });
    upsertMeta("meta[name='twitter:title']", {
      name: "twitter:title",
      content: title,
    });
    upsertMeta("meta[name='twitter:description']", {
      name: "twitter:description",
      content: description,
    });
    upsertMeta("meta[name='twitter:image']", {
      name: "twitter:image",
      content: image,
    });

    upsertLink("canonical", canonicalUrl);

    if (jsonLd) {
      upsertJsonLd(jsonLd);
    } else {
      removeJsonLd();
    }
  }, [description, image, jsonLd, path, robots, title, type]);
}

export const seoDefaults = {
  siteUrl: SITE_URL,
  image: DEFAULT_IMAGE,
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
};

