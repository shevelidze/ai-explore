import { SearchField } from '@/components/search-field';
import Image from 'next/image';
import logo from './assets/logo.svg';

export default function Home() {
  return (
    <div className="h-screen flex items-center justify-center px-5">
      <div className="flex flex-col items-center gap-12 flex-shrink min-w-0">
        <Image src={logo} alt="logo" />
        <SearchField className="w-[650px] max-w-full" />
      </div>
    </div>
  );
}
