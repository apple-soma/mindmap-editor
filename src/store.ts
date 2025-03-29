import { create } from "zustand";
import { Node, Edge, NodeChange, EdgeChange, applyNodeChanges, applyEdgeChanges } from "reactflow";

type Store = {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  setNodes: (setter: (nodes: Node[]) => Node[]) => void;
  setEdges: (setter: (edges: Edge[]) => Edge[]) => void;
};

const centerX = window.innerWidth / 2;
const centerY = window.innerHeight / 5;

export const useStore = create<Store>((set) => ({
  nodes: [
    { 
      id: "1", 
      type: "custom",
      data: { label: "メイントピック" }, 
      position: { x: centerX, y: centerY } 
    },
  ],
  edges: [],
  onNodesChange: (changes) =>
    set((state) => ({ nodes: applyNodeChanges(changes, state.nodes) })),
  onEdgesChange: (changes) =>
    set((state) => ({ edges: applyEdgeChanges(changes, state.edges) })),
  setNodes: (setter) => set((state) => ({ nodes: setter(state.nodes) })),
  setEdges: (setter) => set((state) => ({ edges: setter(state.edges) })),
}));
