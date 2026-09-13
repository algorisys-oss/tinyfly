import { buildLlmsTxt } from './llms-text'

/**
 * The `llms.txt` checked in at the repository root, for models that read the
 * repo on GitHub. Links go to raw markdown on the main branch so they resolve
 * without a hosted site. A test keeps the file in step with the manifest.
 */

const RAW = 'https://raw.githubusercontent.com/algorisys-oss/tinyfly/main'

export function repoLlmsTxt(): string {
  return buildLlmsTxt({
    docUrl: (id) => `${RAW}/docs/${id}.md`,
    optional: [
      { title: 'README', url: `${RAW}/README.md`, summary: 'Feature overview, project layout and development setup.' },
      { title: 'Release notes', url: `${RAW}/release-notes/README.md`, summary: 'What changed in each version.' },
    ],
  })
}
