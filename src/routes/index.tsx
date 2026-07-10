import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '../components/features/layout/MainLayout';
import { HomePage } from '../pages/HomePage';
import { ProfilePage } from '../pages/ProfilePage';
import { MediaDetailsPage } from '../pages/MediaDetailsPage';
import { CollectionsPage } from '../pages/CollectionsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { CollectionDetailsPage } from '../pages/CollectionDetailsPage';
import { RoutinesPage } from '../pages/RoutinesPage';
import { TrackersPage } from '../pages/TrackersPage';
import { TrackerDetailsPage } from '../pages/TrackerDetailsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        path: '',
        element: <HomePage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'task/:id',
        element: <MediaDetailsPage />,
      },
      {
        path: 'collections',
        element: <CollectionsPage />,
      },
      {
        path: 'collection/:id',
        element: <CollectionDetailsPage />,
      },
      {
        path: 'browse',
        element: <SettingsPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: 'routines',
        element: <RoutinesPage />,
      },
      {
        path: 'trackers',
        element: <TrackersPage />,
      },
      {
        path: 'tracker/:id',
        element: <TrackerDetailsPage />,
      }
    ],
  },
]);


