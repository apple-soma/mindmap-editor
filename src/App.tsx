import React, { useState, useCallback, useEffect, useMemo } from "react";
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  Connection,
  Node as FlowNode,
  Edge,
} from "reactflow";
import "reactflow/dist/style.css";
import { useStore } from "./store";
import { fetchLogicTreeSample } from "./services/api"; // ✅ APIをインポート
import CustomNode from "./components/CustomNode";

const nodeTypes = {
  custom: CustomNode,
};

const App: React.FC = () => {
  const { nodes, edges, onNodesChange, onEdgesChange, setNodes, setEdges } = useStore();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");
  const [history, setHistory] = useState<{ nodes: FlowNode[]; edges: Edge[] }[]>([]); // history（履歴）
  const [redoHistory, setRedoHistory] = useState<{ nodes: FlowNode[]; edges: Edge[] }[]>([]); // redoHistory（やり直し履歴）
  const [loading, setLoading] = useState<boolean>(false);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges]
  );

  // ✅ API を呼び出してルートノードに設定
  const loadLogicTreeSample = async () => {
    setLoading(true);
    const logicTreeSample = await fetchLogicTreeSample();
    setNodes(() => [
      {
        id: "1",
        type: "custom",
        data: { label: logicTreeSample },
        position: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
        style: { backgroundColor: "#FFD700", fontWeight: "bold" },
      },
    ]);
    setLoading(false);
  };

  // // ✅ 初回マウント時にロジックツリーを取得
  // useEffect(() => {
  //   loadLogicTreeSample();
  // }, []);



  
  // history（履歴管理）
  const saveHistory = useCallback(() => {
    setHistory((prevHistory) => [...prevHistory, { nodes: [...nodes], edges: [...edges] }]);
    setRedoHistory([]); // 新しい操作を行ったら redo をクリア
  }, [nodes, edges]);
  
  // undo（元に戻す）
  const undo = useCallback(() => {
    if (history.length > 0) {
      const prevState = history[history.length - 1];
  
      setRedoHistory((prevRedo) => [{ nodes: [...nodes], edges: [...edges] }, ...prevRedo]);
      setNodes(() => prevState.nodes);
      setEdges(() => prevState.edges);
      setHistory((prevHistory) => prevHistory.slice(0, -1));
    }
  }, [history, nodes, edges, setNodes, setEdges]);

  // redo（やり直し）
  const redo = useCallback(() => {
    if (redoHistory.length > 0) {
      const nextState = redoHistory[0];
  
      setHistory((prevHistory) => [...prevHistory, { nodes: [...nodes], edges: [...edges] }]);
      setNodes(() => nextState.nodes);
      setEdges(() => nextState.edges);
      setRedoHistory((prevRedo) => prevRedo.slice(1));
    }
  }, [redoHistory, nodes, edges, setNodes, setEdges]);
  

  useEffect(() => {
    // キーボードイベント
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        event.preventDefault();
        saveHistory();
        setNodes((nds) => {
          const newNodeId = `${nds.length + 1}`;
          const parentNode = nds.find((node) => node.id === selectedNodeId) || nds[0];

          const newNode: FlowNode = {
            id: newNodeId,
            type: "custom",
            data: { label: `Node ${newNodeId}` },
            position: {
              x: parentNode.position.x + 150,
              y: parentNode.position.y + 100 + (nds.length * 10),
            },
            style: { backgroundColor: "#ffffff" },
          };
          return [...nds, newNode];
        });

        // エッジ（関連線）を追加
        setEdges((eds) => {
          const parentId = selectedNodeId || nodes[0]?.id;
          const newNodeId = `${nodes.length + 1}`;
        
          if (!parentId) return eds;
        
          // 一意のエッジIDを生成
          const edgeId = `e${parentId}-${newNodeId}-${Date.now()}`;
          return [...eds, {
            id: edgeId,
            source: parentId,
            target: newNodeId,
          }];
        });
      }

      // Delete キーで選択中のノードを削除
      if (event.key === "Delete") {
        event.preventDefault();
        saveHistory(); // ノードを削除する前に履歴を保存
        if (!selectedNodeId) return;

        // ルートノード（最初のノード）は削除できない
        if (selectedNodeId === nodes[0]?.id) {
          alert("ルートノードは削除できません。");
          return;
        }

        setNodes((nds) => nds.filter((node) => node.id !== selectedNodeId));
        setEdges((eds) => eds.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId));
        setSelectedNodeId(null);
      }

      // Ctrl + Z で undo
      if (event.ctrlKey && event.key === "z") {
        event.preventDefault();
        undo();
      }

      // Ctrl + Y で redo
      if (event.ctrlKey && event.key === "y") {
        event.preventDefault();
        redo();
      }

    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [setNodes, setEdges, selectedNodeId, nodes, undo, redo, saveHistory]);

  const onNodeClick = (_event: React.MouseEvent, node: FlowNode) => {
    setSelectedNodeId(node.id);
    setEditingNodeId(node.id);
    setEditingText(node.data.label);

    // ノードリストを更新し、選択されたノードのみ色を変更
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        style: { backgroundColor: n.id === node.id ? "#FFD700" : "#ffffff" }, // 選択中はゴールド、他は白
      }))
    );
  };

  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditingText(event.target.value);
  };

  const onInputBlur = () => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === editingNodeId ? { ...n, data: { label: editingText } } : n
      )
    );
    setEditingNodeId(null);
  };

  const onNodeChange = useCallback((changes: any) => {
    onNodesChange(changes);
    saveHistory();
  }, [onNodesChange, saveHistory]);

  // ノードのテキスト変更を処理
  useEffect(() => {
    const handleNodeTextChange = (event: CustomEvent) => {
      const { id, text } = event.detail;
      setNodes((nds) =>
        nds.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, label: text } } : node
        )
      );
      saveHistory();
    };

    window.addEventListener('nodeTextChange', handleNodeTextChange as EventListener);
    return () => {
      window.removeEventListener('nodeTextChange', handleNodeTextChange as EventListener);
    };
  }, [setNodes, saveHistory]);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>

      <div style={{ display: "flex", gap: "10px", padding: "10px", background: "#eee" }}>
        <button onClick={undo} disabled={history.length === 0}>
          Undo (Ctrl+Z)
        </button>
        <button onClick={redo} disabled={redoHistory.length === 0}>
          Redo (Ctrl+Y)
        </button>
      </div>
      
      <div style={{ display: "flex", gap: "10px", padding: "10px", background: "#eee" }}>
        <button onClick={loadLogicTreeSample} disabled={loading}>
          {loading ? "生成中..." : "ロジックツリーを生成"}
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodeChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
};

export default App;
