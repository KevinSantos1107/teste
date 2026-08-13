import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, getIdTokenResult } from 'firebase/auth';
import { auth } from '../../services/firebase/config';

export type Role = 'super_admin' | 'site_admin' | null;

interface AuthUser {
  uid: string;
  email: string | null;
  role: Role;
  siteId?: string; // For site_admin
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, isLoading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Obtém os Custom Claims definidos no backend
          const tokenResult = await getIdTokenResult(firebaseUser, true);
          const claims = tokenResult.claims;

          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: (claims.role as Role) || null,
            siteId: claims.siteId as string | undefined,
          });
        } catch (error) {
          console.error("Erro ao obter as claims do usuário", error);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: null,
          });
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
