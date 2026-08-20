/**
 * Immutable Node dependency closure for the Windows desktop build.
 * Electron supplies the Node runtime; this release asset supplies the Leio
 * packages that are cached after the first successful startup.
 */
export const DESKTOP_RUNTIME = {
  version: '1.0.3',
  asset: {
    fileName: 'Leio-Harness-runtime-1.0.3-x64.zip',
    sources: [
      {
        name: 'GitHub Release',
        url: 'https://github.com/leizi-dev/leio-harness/releases/download/v1.0.3/Leio-Harness-runtime-1.0.3-x64.zip',
      },
      {
        name: '国内镜像',
        url: 'https://www.chengdalei.xyz/api/v1/downloads/leio-harness/runtime',
        headers: { 'X-Leio-Harness-Runtime-Version': '1.0.3' },
      },
    ],
    size: 79457216,
    sha256: 'e0c87e342e21e15610c293051c8f72876ae03568d727df4a971e5e72f9d9013d',
  },
}
