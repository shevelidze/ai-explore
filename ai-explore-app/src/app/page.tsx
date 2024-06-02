import { SearchField } from '@/components/search-field';
import Image from 'next/image';
import logo from './assets/logo.svg';

export default function Home() {
  return (
    <div className="h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-12">
        <Image src={logo} alt="logo" />
        <SearchField className="w-[650px]" />
      </div>
    </div>
  );
}
