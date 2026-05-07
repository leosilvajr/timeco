// Stub vazio de react-native-reanimated pra web — testa se reanimated é
// o que causa STATUS_ILLEGAL_INSTRUCTION em Chrome mobile.
//
// react-native-reanimated 4.x usa worklets que tem caminho web JS-only,
// mas pode ter bug em V8 mobile. @react-navigation tem fallback sem
// reanimated, entao stubbar deve ser viavel.

const noop = () => {};
const noopReturn = (val) => val;

const Animated = {
  View: 'View',
  Text: 'Text',
  ScrollView: 'ScrollView',
  Image: 'Image',
  FlatList: 'FlatList',
  createAnimatedComponent: (C) => C,
};

module.exports = {
  default: Animated,
  Animated,
  useSharedValue: (v) => ({ value: v }),
  useAnimatedStyle: (cb) => ({}),
  useDerivedValue: (cb) => ({ value: cb() }),
  useAnimatedRef: () => ({ current: null }),
  useAnimatedScrollHandler: () => noop,
  useAnimatedGestureHandler: () => ({}),
  withTiming: noopReturn,
  withSpring: noopReturn,
  withDelay: (_, v) => v,
  withRepeat: noopReturn,
  withSequence: noopReturn,
  cancelAnimation: noop,
  runOnJS: (fn) => fn,
  runOnUI: (fn) => fn,
  Easing: {
    linear: noop,
    ease: noop,
    in: noop,
    out: noop,
    inOut: noop,
    bezier: () => noop,
  },
  interpolate: () => 0,
  Extrapolate: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
  Extrapolation: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
};
