import Login from '@/components/login';
import { currentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';
export default async function LoginPage() { if (await currentUser()) redirect('/panel'); const rows = await query('SELECT count(*) AS n FROM users'); return <Login first={Number(rows[0].n) === 0}/>; }
