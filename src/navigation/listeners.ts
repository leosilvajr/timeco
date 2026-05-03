/**
 * Mapeia cada Tab → primeira tela ("raiz") do stack interno.
 * Usado pelo `tabPress` listener pra resetar a navegação ao tocar
 * na tab — independente do estado atual do stack interno.
 */
export const TAB_ROOT_SCREENS = {
  Jogos: 'EventsList',
  Social: 'FriendsList',
  Perfil: 'ProfileHome',
} as const;

export type ResetTabName = keyof typeof TAB_ROOT_SCREENS;

interface TabListenerNavigation {
  navigate: (name: string, params: { screen: string }) => void;
}

interface TabListenerProps {
  navigation: TabListenerNavigation;
}

/**
 * Factory de listeners pra <Tab.Screen listeners={...}>. Quando o
 * usuário toca na tab, força navegação pra raiz do stack daquela tab.
 *
 * Resolve o caso clássico onde o user está numa tela de criação/edição
 * (CreateEvent, EditEvent, etc.), troca de tab e volta esperando ver
 * a lista — mas o React Navigation preserva o estado interno por padrão.
 */
export const makeTabResetListeners = (tabName: ResetTabName) => {
  const rootScreen = TAB_ROOT_SCREENS[tabName];
  return ({ navigation }: TabListenerProps) => ({
    tabPress: () => {
      navigation.navigate(tabName, { screen: rootScreen });
    },
  });
};
