import { clientBundle } from '../../client/tsdown.client.ts'

export default clientBundle(
  '@leio-ai/leio-api-remotes',
  ['lib/types/index.js', 'lib/types/invariant.js'],
  { hostPhase: true },
)
