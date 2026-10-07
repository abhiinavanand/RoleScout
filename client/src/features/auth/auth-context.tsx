import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as authApi from "../../api/auth";

type AuthContextValue = { user: authApi.User | null; isLoading: boolean; error: Error | null; login: (input: { email: string; password: string }) => Promise<void>; register: (input: { name: string; email: string; password: string }) => Promise<void>; logout: () => Promise<void> };
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const [user, setUser] = useState<authApi.User | null>(null);
  const currentUser = useQuery({ queryKey: ["auth", "me"], queryFn: authApi.getCurrentUser, retry: false });
  const loginMutation = useMutation({ mutationFn: authApi.login, onSuccess: (data) => { setUser(data.user); client.setQueryData(["auth", "me"], data); } });
  const registerMutation = useMutation({ mutationFn: authApi.register, onSuccess: (data) => { setUser(data.user); client.setQueryData(["auth", "me"], data); } });
  const logoutMutation = useMutation({ mutationFn: authApi.logout, onSuccess: () => { setUser(null); client.removeQueries({ queryKey: ["auth", "me"] }); } });
  const resolvedUser = user ?? currentUser.data?.user ?? null;
  const value = useMemo(() => ({ user: resolvedUser, isLoading: currentUser.isLoading, error: (currentUser.error ?? loginMutation.error ?? registerMutation.error) as Error | null, login: async (input: { email: string; password: string }) => { await loginMutation.mutateAsync(input); }, register: async (input: { name: string; email: string; password: string }) => { await registerMutation.mutateAsync(input); }, logout: async () => { await logoutMutation.mutateAsync(); } }), [resolvedUser, currentUser.isLoading, currentUser.error, loginMutation.error, registerMutation.error]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
