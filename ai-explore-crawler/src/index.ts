import { Crawler } from './crawler';

async function main() {
  const crawler = new Crawler();
  await crawler.connect();
  await crawler.crawlUncrawled();
}

main().then(() => {
  process.exit(0);
});
