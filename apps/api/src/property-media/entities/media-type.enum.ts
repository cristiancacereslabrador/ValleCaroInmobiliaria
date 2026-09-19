export enum MediaType {
  PHOTO = 'photo',
  VIDEO = 'video',
  /**
   * Tour virtual 360°: imagen panoramica equirectangular, almacenada y
   * validada como una imagen mas (property-virtual-tours - design.md,
   * Decision 1). La unica diferencia real frente a "photo" es el visor
   * usado en el frontend.
   */
  TOUR_360 = 'tour360',
}
