import { type DirectedAcyclicGraphNode } from "./type";

/**
 * Validates a directed acyclic graph before node construction.
 *
 * @param {readonly DirectedAcyclicGraphNode[]} nodes - Graph nodes keyed by name.
 * @returns {void}
 * @throws {Error} If node names are duplicated, reference unknown nodes, or form a cycle.
 */
export const validateDirectedAcyclicGraph = (
  nodes: readonly DirectedAcyclicGraphNode[]
): void => {
  const names = nodes.map((node) => {
    return node.name;
  });
  const inDegree: Record<string, number> = Object.fromEntries(
    names.map((name) => {
      return [name, 0];
    })
  );
  const dependents: Record<string, string[]> = Object.fromEntries(
    names.map((name): [string, string[]] => {
      return [name, [] as string[]];
    })
  );

  const duplicates = names.filter((name, index) => {
    return names.indexOf(name) !== index;
  });
  if (duplicates.length > 0) {
    throw new Error(
      `Duplicate node names: ${[...new Set(duplicates)].join(", ")}`
    );
  }

  const nameSet = new Set(names);
  for (const node of nodes) {
    for (const dependency of node.dependsOn ?? []) {
      if (!nameSet.has(dependency)) {
        throw new Error(
          `Node "${node.name}" depends on unknown node "${dependency}"`
        );
      }
    }
  }

  for (const node of nodes) {
    for (const dependency of node.dependsOn ?? []) {
      inDegree[node.name] += 1;
      dependents[dependency].push(node.name);
    }
  }

  const queue = names.filter((name) => {
    return inDegree[name] === 0;
  });
  let processed = 0;

  for (let queueIndex = 0; queueIndex < queue.length; queueIndex++) {
    const name = queue[queueIndex];
    processed++;
    for (const dependent of dependents[name]) {
      const nextInDegree = inDegree[dependent] - 1;
      inDegree[dependent] = nextInDegree;
      if (nextInDegree === 0) {
        queue.push(dependent);
      }
    }
  }

  if (processed !== names.length) {
    throw new Error("Cycle detected in directed acyclic graph");
  }
};
