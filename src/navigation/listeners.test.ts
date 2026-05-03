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

describe('makeTabResetListeners', () => {
  const tabs: ResetTabName[] = ['Jogos', 'Social', 'Perfil'];

  it.each(tabs)('ao tocar na tab %s, navega pra raiz do stack', (tab) => {
    const navigate = jest.fn();
    const listenersFactory = makeTabResetListeners(tab);
    const listeners = listenersFactory({ navigation: { navigate } });

    listeners.tabPress();

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(tab, {
      screen: TAB_ROOT_SCREENS[tab],
    });
  });

  it('cada tabPress emite uma nova navegação (sem cache)', () => {
    const navigate = jest.fn();
    const factory = makeTabResetListeners('Jogos');
    const listeners = factory({ navigation: { navigate } });

    listeners.tabPress();
    listeners.tabPress();
    listeners.tabPress();

    expect(navigate).toHaveBeenCalledTimes(3);
  });

  it('factories de tabs diferentes não compartilham estado', () => {
    const navigate = jest.fn();
    const jogos = makeTabResetListeners('Jogos')({ navigation: { navigate } });
    const social = makeTabResetListeners('Social')({ navigation: { navigate } });

    jogos.tabPress();
    social.tabPress();

    expect(navigate).toHaveBeenNthCalledWith(1, 'Jogos', { screen: 'EventsList' });
    expect(navigate).toHaveBeenNthCalledWith(2, 'Social', { screen: 'FriendsList' });
  });
});
