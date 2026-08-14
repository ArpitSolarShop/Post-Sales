import { redirect } from 'next/navigation';

export default function AdminPage() {
  // Redirect to dashboard automatically
  redirect('/admin/dashboard');
}
