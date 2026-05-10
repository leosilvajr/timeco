// Mock CommonActions.reset pra evitar parse issue com @react-navigation/native em jest-node
jest.mock('@react-navigation/native', () => ({
  CommonActions: {
    reset: (config: unknown) => ({ type: 'RESET', payload: config }),
  },
}));

import { TAB_ROOT_SCREENS, makeTabResetListeners, ResetTabName } from './listeners';

describe('TAB_ROOT_SCREENS', () => {
  it('mapeia cada tab pra raiz da sua stack interna', () => {
    expect(TAB_ROOT_SCREENS).toEqual({
      Jogos: 'EventsList',
      Social: 'FriendsList',
      Perfil: 'ProfileHome',
    });
  });
});

const eventArg = () => {
  const ev = { preventDefault: jest.fn() };
  return ev;
};

const buildNavMock = (tabState?: { key: string; routes: { name: string }[] }) => {
  const navigate = jest.fn();
  const dispatch = jest.fn();
  const getState = jest.fn().mockReturnValue({
    routes: tabState
      ? [{ name: 'Jogos', state: tabState }]
      : [{ name: 'Jogos' }],
  });
  return { navigate, dispatch, getState };
};

describe('makeTabResetListeners', () => {
  const tabs: ResetTabName[] = ['Jogos', 'Social', 'Perfil'];

  it.each(tabs)('preventDefault e navigate(%s) sempre', (tab) => {
    const factory = makeTabResetListeners(tab);
    const navMock = buildNavMock();
    const listeners = factory({ navigation: navMock });
    const ev = eventArg();

    listeners.tabPress(ev);

    expect(ev.preventDefault).toHaveBeenCalledTimes(1);
    expect(navMock.navigate).toHaveBeenCalledWith(tab);
  });

  it('quando stack interna tem 1 rota e e raiz, NAO dispatcha reset', () => {
    const factory = makeTabResetListeners('Jogos');
    const navMock = buildNavMock({
      key: 'inner-1',
      routes: [{ name: 'EventsList' }],
    });
    const listeners = factory({ navigation: navMock });

    listeners.tabPress(eventArg());

    expect(navMock.dispatch).not.toHaveBeenCalled();
  });

  it('quando stack interna tem mais de 1 rota, dispatcha reset com target', () => {
    const factory = makeTabResetListeners('Jogos');
    const navMock = buildNavMock({
      key: 'inner-stack-key-xyz',
      routes: [{ name: 'EventsList' }, { name: 'EventDetail' }],
    });
    const listeners = factory({ navigation: navMock });

    listeners.tabPress(eventArg());

    expect(navMock.dispatch).toHaveBeenCalledTimes(1);
    const action = navMock.dispatch.mock.calls[0][0];
    expect(action.target).toBe('inner-stack-key-xyz');
    expect(action.payload?.routes?.[0]?.name).toBe('EventsList');
  });

  it('quando stack interna tem 1 rota mas NAO e raiz (cross-tab nav), reseta', () => {
    const factory = makeTabResetListeners('Jogos');
    const navMock = buildNavMock({
      key: 'inner-stack-key-cross',
      routes: [{ name: 'EventDetail' }],
    });
    const listeners = factory({ navigation: navMock });

    listeners.tabPress(eventArg());

    expect(navMock.dispatch).toHaveBeenCalledTimes(1);
    const action = navMock.dispatch.mock.calls[0][0];
    expect(action.target).toBe('inner-stack-key-cross');
    expect(action.payload?.routes?.[0]?.name).toBe('EventsList');
  });
});
