import { currentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Provider } from '@/components/provider';
import Workspace from '@/components/workspace';
export const dynamic = 'force-dynamic';
export default async function Panel() { if (!await currentUser()) redirect('/login'); return <Provider><Workspace/></Provider>; }
