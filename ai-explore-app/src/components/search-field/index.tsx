'use client';

import {
  faArrowCircleRight,
  faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Spinner } from '@/components/spinner';

type Props = React.ComponentProps<'input'>;

const SearchField: React.FC<Props> = ({ className, ...props }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const searchParam = searchParams.get('search');

  const [searchQuery, setSearchQuery] = useState<string>(searchParam ?? '');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const goToSearchPage = () => {
    if (searchParam === searchQuery) {
      return;
    }

    setIsLoading(true);
    router.push(`/search?search=${searchQuery}`);
  };

  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const onSearchButtonClick = () => {
    goToSearchPage();
  };

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      goToSearchPage();
    }
  };

  useEffect(() => {
    setIsLoading(false);
  }, [searchParam]);

  return (
    <div
      className={classNames(
        'h-12 bg-space-white flex items-center gap-4 px-3 rounded-md flex-shrink-0',
        className
      )}
    >
      <FontAwesomeIcon icon={faMagnifyingGlass} className="text-3xl" />
      <input
        {...props}
        onChange={onInputChange}
        onKeyDown={onInputKeyDown}
        value={searchQuery}
        type="text"
        className="h-full bg-transparent flex-grow text-space-black text-xl focus:outline-none placeholder:text-space-gray min-w-0 flex-shrink"
      />
      <button
        type="button"
        onClick={onSearchButtonClick}
        className="flex-shrink-0"
      >
        {isLoading ? (
          <Spinner className="text-3xl text-space-blue-default" />
        ) : (
          <FontAwesomeIcon
            icon={faArrowCircleRight}
            className="text-3xl text-space-blue-default"
          />
        )}
      </button>
    </div>
  );
};

export { SearchField };
