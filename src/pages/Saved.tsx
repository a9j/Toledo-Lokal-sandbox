import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { SavedPlacesList } from '@/components/profile/SavedPlacesList';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function Saved() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <>
      <Header title="Saved Places" showBack />
      <PageContainer>
        <SavedPlacesList />
      </PageContainer>
    </>
  );
}
