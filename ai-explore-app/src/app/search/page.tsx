import { SearchField } from '@/components/search-field';
import { SearchResult } from '@/components/search-result';
import { searchService } from '@/services/search';
import { ServerComponentProps } from '@/types/server-component-props';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import logo from '../assets/logo.svg';
import Link from 'next/link';

export default async function Search({ searchParams }: ServerComponentProps) {
  const searchQuery = searchParams?.search;

  if (typeof searchQuery !== 'string') {
    return notFound();
  }

  const searchResults = await searchService.search(searchQuery);

  return (
    <div className="flex justify-center px-5 py-16">
      <div className="max-w-[800px] flex-shrink min-w-0">
        <div className="flex justify-center mb-5">
          <Link href="/">
            <Image src={logo} alt="logo" />
          </Link>
        </div>
        <SearchField className="mb-14" />
        <div className="flex flex-col gap-10">
          {searchResults.map((page) => (
            <SearchResult
              key={page.id}
              url={page.url}
              metaDescription={page.metaDescription}
              title={page.title}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
