import { clientLibrary } from '../../client/tsdown.client.ts'

export default clientLibrary(
  '@leio-ai/leio-client-test-runtime',
  ['lib/types/index.js', 'lib/types/invariant.js'],
)
