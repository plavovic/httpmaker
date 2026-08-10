export type AutosaveOperation = { revision: number; signal: AbortSignal };

export function createAutosaveCoordinator() {
  let revision = 0;
  let controller: AbortController | undefined;
  return {
    begin(): AutosaveOperation {
      controller?.abort();
      controller = new AbortController();
      return { revision: ++revision, signal: controller.signal };
    },
    isCurrent(operation: AutosaveOperation) { return operation.revision === revision && !operation.signal.aborted; },
    cancel() { controller?.abort(); },
    get revision() { return revision; },
  };
}
