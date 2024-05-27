class UrlAnalyzer {
  constructor(url: string, baseUrl?: string) {
    this.url = url;
    this.urlObject = new URL(url, baseUrl);
  }

  isHypertext() {
    return (
      this.urlObject.protocol === 'http:' ||
      this.urlObject.protocol === 'https:'
    );
  }

  isSamePage(targetUrl: string) {
    if (!URL.canParse(targetUrl, this.url)) {
      return false;
    }

    const targetUrlObject = new URL(targetUrl);

    return (
      this.urlObject.origin === targetUrlObject.origin &&
      this.urlObject.pathname === targetUrlObject.pathname &&
      this.urlObject.search === targetUrlObject.search
    );
  }

  getBarePageUrl() {
    return (
      this.urlObject.origin + this.urlObject.pathname + this.urlObject.search
    );
  }

  public static canParse(url: string, baseUrl: string) {
    return URL.canParse(url, baseUrl);
  }

  private url: string;
  private urlObject: URL;
}

export { UrlAnalyzer };
