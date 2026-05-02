import { useAuthStore } from './authStore';
import { User } from '../types';

const sample: User = {
  id: 'u1',
  email: 'a@b.com',
  name: 'Alice',
  role: 'user',
  createdAt: null,
};

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, loading: true });
  });

  it('estado inicial: user null e loading true', () => {
    const s = useAuthStore.getState();
    expect(s.user).toBeNull();
    expect(s.loading).toBe(true);
  });

  it('setUser define o usuário', () => {
    useAuthStore.getState().setUser(sample);
    expect(useAuthStore.getState().user).toEqual(sample);
  });

  it('setUser(null) limpa o usuário', () => {
    useAuthStore.getState().setUser(sample);
    useAuthStore.getState().setUser(null);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('setLoading muda a flag', () => {
    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().loading).toBe(false);
  });

  it('patchUser mescla campos no usuário existente', () => {
    useAuthStore.getState().setUser(sample);
    useAuthStore.getState().patchUser({ name: 'Alice Atualizada' });
    const s = useAuthStore.getState();
    expect(s.user?.name).toBe('Alice Atualizada');
    expect(s.user?.email).toBe('a@b.com');
    expect(s.user?.id).toBe('u1');
  });

  it('patchUser não cria usuário quando user é null', () => {
    useAuthStore.getState().patchUser({ name: 'Ninguém' });
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('setProfile é alias de setUser', () => {
    useAuthStore.getState().setProfile(sample);
    expect(useAuthStore.getState().user).toEqual(sample);
  });
});
