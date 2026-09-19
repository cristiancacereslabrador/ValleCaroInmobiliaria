import { redirect } from 'next/navigation';

export default function EditPropertyRedirectPage({ params }: { params: { id: string } }) {
  redirect(`/admin/propiedades/${params.id}/editar`);
}
