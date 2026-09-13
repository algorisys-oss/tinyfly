import { extractCode, type LiveDemoWithCode } from '../live-demos'
import { agencyLanding } from './agency-landing'
import agencyLandingSource from './agency-landing.js?raw'

/**
 * Full-page showcases: whole sites built from the GSAP-style API, running on the
 * real window scroll. They share the live demos' shape (markup plus `run`), but
 * each is a page rather than a card — opened at `/showcase/<id>`, and copied as a
 * standalone page that is the same markup and code.
 */
export const showcases: LiveDemoWithCode[] = [{ ...agencyLanding, code: extractCode(agencyLandingSource) }]

export function findShowcase(id: string): LiveDemoWithCode | undefined {
  return showcases.find((showcase) => showcase.id === id)
}
