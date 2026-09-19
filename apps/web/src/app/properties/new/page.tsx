import { redirect } from 'next/navigation';

export default function NewPropertyRedirectPage() {
  redirect('/admin/propiedades/nueva');
}
