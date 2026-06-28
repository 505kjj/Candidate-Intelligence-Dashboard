import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { CursorSpotlight } from "@/components/CursorSpotlight";
import { PageTransition } from "@/components/PageTransition";

export const metadata: Metadata = {
  title: "Candidate Intelligence Dashboard",
  description: "Explainable candidate ranking for intelligent candidate discovery."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function () {
  var extensionAttribute = "bis_skin_checked";
  function clean(root) {
    if (!root || !root.querySelectorAll) return;
    if (root.getAttribute && root.hasAttribute(extensionAttribute)) {
      root.removeAttribute(extensionAttribute);
    }
    root.querySelectorAll("[" + extensionAttribute + "]").forEach(function (node) {
      node.removeAttribute(extensionAttribute);
    });
  }
  clean(document.documentElement);
  var observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.type === "attributes" && mutation.attributeName === extensionAttribute) {
        mutation.target.removeAttribute(extensionAttribute);
      }
      mutation.addedNodes.forEach(function (node) {
        if (node.nodeType === 1) clean(node);
      });
    });
  });
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: [extensionAttribute]
  });
  window.addEventListener("DOMContentLoaded", function () {
    clean(document.documentElement);
    window.setTimeout(function () {
      clean(document.documentElement);
      observer.disconnect();
    }, 3000);
  });
})();
            `.trim()
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <div className="pointer-events-none fixed inset-0 soft-grid opacity-60" />
        <CursorSpotlight />
        <Nav />
        <main className="relative z-10">
          <PageTransition>{children}</PageTransition>
        </main>
        <footer className="relative z-10 border-t border-white/10 px-4 py-8 text-center text-sm text-slate-500">
          Candidate Intelligence Dashboard
        </footer>
      </body>
    </html>
  );
}
