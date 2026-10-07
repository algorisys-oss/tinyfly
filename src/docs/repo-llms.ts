import { buildLlmsTxt, buildLlmsFullTxt } from './llms-text'

/**
 * The \`llms.txt\` and \`llms-full.txt\` checked in at the repository root (and
 * shipped in the npm package), for models that read the repo or the
 * installed package. Links go to raw markdown at the release tag, so they
 * match the version the reader has. A test keeps both files in step with the
 * manifest, the docs and the library's capability catalog.
 */

const raw = (version: string) => `https://raw.githubusercontent.com/algorisys-oss/tinyfly/v${version}`

export function repoLlmsTxt(version: string): string {
  return buildLlmsTxt({
    docUrl: (id) => `${raw(version)}/docs/${id}.md`,
    fullUrl: `${raw(version)}/llms-full.txt`,
    optional: [
      { title: 'README', url: `${raw(version)}/README.md`, summary: 'Feature overview, project layout and development setup.' },
      { title: 'Release notes', url: `${raw(version)}/release-notes/README.md`, summary: 'What changed in each version.' },
    ],
  })
}

/** Every doc, the interactive course and the capability catalog, in one file. */
export function repoLlmsFullTxt(readDoc: (id: string) => string, courseText: string, capabilitiesText: string): string {
  return buildLlmsFullTxt(readDoc, courseText, capabilitiesText)
}
