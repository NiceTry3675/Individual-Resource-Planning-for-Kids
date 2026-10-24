/* fx-scaffold */
/*
 * The FlipBack flows this app calls on their test stage, by gateway path. The builder rewrites this file
 * whenever the project's stage settings change, so the stage choice never lives in generated code.
 */
const FLOW_TEST_PATHS: ReadonlySet<string> = new Set<string>([]);

/** The header that selects a flow's serving stage; a live flow sends none. */
export function flowStageHeaders(path: string): Record<string, string> {
  return FLOW_TEST_PATHS.has(path) ? { 'X-Flow-Stage': 'test' } : {};
}
