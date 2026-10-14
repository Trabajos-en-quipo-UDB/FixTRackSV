import Login from '@/components/login';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';
export default async function LoginPage() { if (await currentUser()) redirect('/panel'); return <Login first={db().prepare('SELECT count(*) AS n FROM users').get().n === 0}/>; }
