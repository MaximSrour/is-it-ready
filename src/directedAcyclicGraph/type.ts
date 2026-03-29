export type DirectedAcyclicGraphNode = {
  name: string;
  dependsOn?: readonly string[];
};
