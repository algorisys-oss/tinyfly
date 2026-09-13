/**
 * Whether this browser has used the editor before, checked without loading it.
 *
 * The editor keeps projects in an IndexedDB database named `tinyfly` (older
 * versions used LocalStorage). Opening that database here could create an empty
 * one and skip the editor's own upgrade step, so this only lists databases
 * (`indexedDB.databases()`) and reads the old LocalStorage keys, never opening
 * anything.
 */
export async function hasSavedWork(): Promise<boolean> {
  try {
    if (localStorage.getItem('tinyfly-projects') || localStorage.getItem('tinyfly-current-project')) return true
  } catch {
    // Storage blocked (private mode): fall through to IndexedDB.
  }
  try {
    const list = await indexedDB.databases?.()
    return !!list?.some((db) => db.name === 'tinyfly')
  } catch {
    return false
  }
}
