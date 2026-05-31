export interface Collection {
  id: string;
  name: string;
  color: string;
  icon: string;
  userId: string;
  createdAt: string;
}

export interface Subcollection {
  id: string;
  collectionId: string;
  name: string;
  color: string;
  icon: string;
  userId: string;
  createdAt: string;
}
