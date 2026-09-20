import { CaptureLeadForm } from '../../components/CaptureLeadForm';

export default function CapturePage() {
  return (
    <main className="page page-editorial">
      <p className="eyebrow">Captaciones</p>
      <h1>Quiero publicar un inmueble</h1>
      <p className="page-subtitle">
        Este es un portal de captaciones. Deja tus datos y la asesora te escribe para fotos, precio
        y publicación. El acceso a cargar fichas se da solo a quien ella autorice.
      </p>
      <div className="section">
        <CaptureLeadForm />
      </div>
    </main>
  );
}
