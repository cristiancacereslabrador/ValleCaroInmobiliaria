import { ValuationEstimatorForm } from '../../components/ValuationEstimatorForm';

/**
 * Solicitud pública de tasación: el visitante deja datos y contacto.
 * El precio no se calcula ni se muestra aquí; lo sugiere el asesor tras
 * conocer la propiedad y entregar un informe.
 */
export default function ValuationPage() {
  return (
    <main className="page">
      <div className="page-header">
        <h1>Solicitar tasación</h1>
      </div>
      <p className="page-subtitle">
        Deja el tipo de inmueble y tu contacto. Un asesor visitará la propiedad, la analizará y te
        entregará un informe con una sugerencia de valor. El precio de venta lo pones tú; el
        asesor solo orienta.
      </p>
      <div className="section">
        <ValuationEstimatorForm />
      </div>
    </main>
  );
}
