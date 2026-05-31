import { collectionsService } from './collectionsService';

export const collectionsApi = {
  getCollections: collectionsService.fetchCollections.bind(collectionsService),
  addCollection: collectionsService.createCollection.bind(collectionsService),
  deleteCollection: collectionsService.removeCollection.bind(collectionsService),
};
