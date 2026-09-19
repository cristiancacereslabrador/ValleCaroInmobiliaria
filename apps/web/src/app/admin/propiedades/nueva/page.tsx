import { AdminGuard } from '../../../../components/AdminGuard';
import { PropertyForm } from '../../../../components/PropertyForm';

export default function AdminNewPropertyPage() {
  return (
    <AdminGuard>
      <main className="page">
        <div className="page-header">
          <h1>Nueva propiedad</h1>
        </div>
        <div className="section">
          <PropertyForm mode="create" />
        </div>
      </main>
    </AdminGuard>
  );
}
