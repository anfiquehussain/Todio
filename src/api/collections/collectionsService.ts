import { sleep } from '../base';
import type { Collection } from '../../types';

export const collectionsService = {
  async fetchCollections(): Promise<Collection[]> {
    await sleep();
    const categoriesStr = localStorage.getItem('todo_categories');
    return categoriesStr ? JSON.parse(categoriesStr) : [];
  },

  async createCollection(collection: Collection): Promise<Collection> {
    await sleep();
    const categories = await this.fetchCollections();
    categories.push(collection);
    localStorage.setItem('todo_categories', JSON.stringify(categories));
    return collection;
  },

  async removeCollection(id: string): Promise<string> {
    await sleep();
    const categories = await this.fetchCollections();
    const updated = categories.filter((c) => c.id !== id);
    localStorage.setItem('todo_categories', JSON.stringify(updated));
    return id;
  }
};
