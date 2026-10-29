export function resumirInclusiones(included: readonly boolean[], anterior: readonly boolean[] = []) {
  return {
    total: included.filter(Boolean).length,
    nuevas: included.flatMap((incluido, indice) => incluido && !anterior[indice] ? [indice] : []).slice(0, 3),
  };
}