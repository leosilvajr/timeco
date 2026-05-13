/**
 * Barrel re-export do scout de volei.
 *
 * As implementacoes vivem em src/services/volley/{matchCRUD,scoutActions,
 * matchLifecycle,matchHelpers}.ts pra manter cada arquivo enxuto e
 * focado num concern.
 *
 * Este arquivo existe pra manter retro-compatibilidade dos imports:
 *   import { performScoutAction } from '../../services/volleyScoutService';
 * continua funcionando.
 */

export {
  createVolleyMatch,
  getVolleyMatch,
  listUserVolleyMatches,
  subscribeVolleyMatch,
  deleteVolleyMatch,
} from './volley/matchCRUD';
export type { CreateVolleyMatchInput } from './volley/matchCRUD';

export {
  actionScoreImpact,
  previewScoutAction,
  performScoutAction,
  recordAction,
  updateScore,
  registerPoint,
  undoLastPoint,
} from './volley/scoutActions';

export {
  startVolleyMatch,
  finishCurrentSet,
  resetVolleyMatch,
  rotateManual,
  rotateManualBack,
  resetRotation,
  setInitialRotation,
} from './volley/matchLifecycle';
