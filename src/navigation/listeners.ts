import { CommonActions } from '@react-navigation/native';

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

/* eslint-disable @typescript-eslint/no-explicit-any */
interface TabListenerProps {
  navigation: any;
}

/**
 * Factory de listeners pra <Tab.Screen listeners={...}>. Quando o
 * usuário toca na tab, FORÇA navegação pra raiz do stack daquela tab,
 * resetando todo o historico interno.
 *
 * Algoritmo:
 * 1. preventDefault() pra cancelar o foco automatico
 * 2. Le o state do tab navigator pra achar a stack interna da tab
 * 3. Se a stack interna existe e tem mais de 1 rota (= deep), dispatch
 *    CommonActions.reset com target = key da stack, deixando so a raiz
 * 4. Sempre faz navigate(tabName) pra focar a tab depois
 *
 * Resolve cenários onde:
 * - User vai de Home → Jogos > EventDetail (cross-tab navigate)
 * - Volta pra Home (nav.goBack)
 * - Toca em Jogos esperando ver a lista
 *   → ANTES: ainda mostrava EventDetail (stack interna preservada)
 *   → AGORA: stack interna resetada pra raiz (EventsList)
 */
export const makeTabResetListeners = (tabName: ResetTabName) => {
  const rootScreen = TAB_ROOT_SCREENS[tabName];
  return ({ navigation }: TabListenerProps) => ({
    tabPress: (e: { preventDefault: () => void }) => {
      e.preventDefault();
      const state = navigation.getState?.();
      const tabRoute = state?.routes?.find((r: any) => r.name === tabName);
      const innerKey = tabRoute?.state?.key;
      const innerRoutes: unknown[] = tabRoute?.state?.routes ?? [];

      // Se a stack interna ja existe e tem mais de 1 rota (deep), reseta
      if (innerKey && innerRoutes.length > 1) {
        navigation.dispatch({
          ...CommonActions.reset({
            index: 0,
            routes: [{ name: rootScreen }],
          }),
          target: innerKey,
        });
      } else if (innerKey && innerRoutes.length === 1) {
        // Tem 1 rota, mas pode nao ser a raiz (ex: chegou direto via cross-tab)
        const onlyRoute = innerRoutes[0] as { name: string };
        if (onlyRoute.name !== rootScreen) {
          navigation.dispatch({
            ...CommonActions.reset({
              index: 0,
              routes: [{ name: rootScreen }],
            }),
            target: innerKey,
          });
        }
      }
      // Foca a tab (caso user estivesse em outra)
      navigation.navigate(tabName);
    },
  });
};
