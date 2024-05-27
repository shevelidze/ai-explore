import { JSDOM } from 'jsdom';
import { htmlToText } from 'html-to-text';
import { UrlAnalyzer } from './url-analyzer';

class PageParser {
  public constructor(pageHtml: string, pageUrl: string) {
    this.pageDom = new JSDOM(pageHtml);
    this.pageHtml = pageHtml;
    this.pageUrl = pageUrl;
  }

  public getTitle() {
    return this.pageDom.window.document.title || undefined;
  }

  public getMetaDescription() {
    const metaDescriptionElement = this.pageDom.window.document.querySelector(
      'meta[name="description"]'
    );

    return metaDescriptionElement
      ? metaDescriptionElement.getAttribute('content')
      : null;
  }

  public getText() {
    return htmlToText(this.pageHtml);
  }

  public getOutgoingUrls() {
    const outgoingUrls = new Set<string>();

    this.pageDom.window.document.querySelectorAll('a').forEach((aElement) => {
      const href = aElement.getAttribute('href');

      if (href && UrlAnalyzer.canParse(href, this.pageUrl)) {
        const urlAnalyzer = new UrlAnalyzer(href, this.pageUrl);

        if (
          urlAnalyzer.isHypertext() &&
          !urlAnalyzer.isSamePage(this.pageUrl)
        ) {
          outgoingUrls.add(urlAnalyzer.getBarePageUrl());
        }
      }
    });

    return Array.from(outgoingUrls);
  }

  private pageDom: JSDOM;
  private pageHtml: string;
  private pageUrl: string;
}

export { PageParser };
