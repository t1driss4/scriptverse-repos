import { redirect } from 'next/navigation';

// Root redirects to the catalogue (public landing)
export default function Home() {
  redirect('/catalogue');
}
