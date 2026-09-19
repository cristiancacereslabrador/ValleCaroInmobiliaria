import { ValuationEstimatorForm } from '../../components/ValuationEstimatorForm';

/**
 * specs/property-valuation-estimator/spec.md - Requirement "Formulario de
 * tasacion independiente del catalogo publicado": ruta propia
 * (`/valuation`), separada de `/properties/*` (catalogo publicado).
 */
export default function ValuationPage() {
  return (
    <main className="page">
      <div className="page-header">
        <h1>Estimador de valor de vivienda</h1>
      </div>
      <p className="page-subtitle">
        Indica las características de tu vivienda y compara con propiedades similares del
        catálogo.
      </p>
      <div className="section">
        <ValuationEstimatorForm />
      </div>
    </main>
  );
}
