import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavedPropertyList } from './entities/saved-property-list.entity';
import { SavedPropertyListItem } from './entities/saved-property-list-item.entity';
import { Property } from '../properties/entities/property.entity';
import { SavedPropertyListsService } from './saved-property-lists.service';
import { SavedPropertyListsController } from './saved-property-lists.controller';

/**
 * Modulo autocontenido de `saved-property-lists`: solo registra `Property`
 * en modo lectura (para validar que existe al añadirla a una lista), sin
 * importar `PropertiesModule` ni depender de PropertiesService/Controller.
 */
@Module({
  imports: [TypeOrmModule.forFeature([SavedPropertyList, SavedPropertyListItem, Property])],
  controllers: [SavedPropertyListsController],
  providers: [SavedPropertyListsService],
})
export class SavedPropertyListsModule {}
