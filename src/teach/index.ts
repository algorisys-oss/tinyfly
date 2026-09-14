/**
 * tinyfly/teach — authoring helpers for teaching animations: `lesson()` writes
 * steps as timeline JSON, and diagram primitives (cells, pointer, stack, queue,
 * table, pipeline) produce SVG markup with matching step helpers. They run
 * anywhere (browser, Node, a build script); the output is ordinary markup and
 * keyframes for `tinyfly/embed`.
 */
export { lesson } from './lesson'
export type { LessonBuilder, StepOptions, MarkerOptions } from './lesson'
export { figure, cells, pointer, stack, queue, table, pipeline, DEFAULT_THEME } from './diagrams'
export type { Piece, Theme, Cells, Pointer, Stack, Queue, Table, Pipeline } from './diagrams'
