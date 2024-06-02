'use client';

import { useMemo } from 'react';

type Props = {
  url: string;
  title?: string | null;
  metaDescription?: string | null;
};

const SearchResult: React.FC<Props> = ({ url, title, metaDescription }) => {
  const bareUrl = useMemo(() => {
    const urlObject = new URL(url);
    return urlObject.protocol + urlObject.hostname + urlObject.pathname;
  }, [url]);

  return (
    <div>
      <a
        href={url}
        className="text-space-blue-light font-bold hover:underline overflow-hidden text-ellipsis block max-w-max"
      >
        {title ?? url}
      </a>
      <div className="text-space-gray overflow-hidden text-ellipsis">
        {bareUrl}
      </div>
      <div className="text-space-white overflow-hidden text-ellipsis">
        {metaDescription}
      </div>
    </div>
  );
};

export { SearchResult };
