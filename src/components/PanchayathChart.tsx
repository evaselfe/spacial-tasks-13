import { useEffect, useState, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PanchayathChartData {
  id: string;
  name: string;
  coordinators: Array<{ id: string; name: string; rating?: number }>;
  supervisors: Array<{ id: string; name: string; wards: string[] }>;
  group_leaders: Array<{ id: string; name: string; ward_number: number }>;
  pros: Array<{ id: string; name: string; group_leader_id: string }>;
}

export const PanchayathChart = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [],
  );

  const fetchChartData = async () => {
    try {
      const { data: panchayaths, error } = await supabase
        .from("panchayaths")
        .select(`
          id,
          name,
          coordinators:coordinators(id, name, rating),
          supervisors:supervisors(id, name, wards),
          group_leaders:group_leaders(id, name, ward_number),
          pros:pros(id, name, group_leader_id)
        `);

      if (error) throw error;

      if (panchayaths && panchayaths.length > 0) {
        generateChartNodes(panchayaths);
      }
    } catch (error: any) {
      console.error("Error fetching chart data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch organizational data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateChartNodes = (data: any[]) => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    let yOffset = 0;

    data.forEach((panchayath, panchayathIndex) => {
      const panchayathY = yOffset;
      
      // Panchayath root node
      newNodes.push({
        id: `panchayath-${panchayath.id}`,
        type: 'default',
        data: { 
          label: (
            <div className="text-center">
              <div className="font-bold text-primary">{panchayath.name}</div>
              <div className="text-xs text-muted-foreground">Panchayath</div>
            </div>
          )
        },
        position: { x: 400, y: panchayathY },
        style: {
          background: 'hsl(var(--primary) / 0.1)',
          border: '2px solid hsl(var(--primary))',
          borderRadius: '8px',
          width: 200,
        },
      });

      let coordinatorY = panchayathY + 150;
      
      // Coordinators
      panchayath.coordinators?.forEach((coordinator: any, coordIndex: number) => {
        const coordId = `coordinator-${coordinator.id}`;
        newNodes.push({
          id: coordId,
          type: 'default',
          data: { 
            label: (
              <div className="text-center">
                <div className="font-semibold">{coordinator.name}</div>
                <div className="text-xs text-muted-foreground">Coordinator</div>
                {coordinator.rating && (
                  <div className="text-xs bg-coordinator text-white px-1 rounded">
                    ★ {coordinator.rating}
                  </div>
                )}
              </div>
            )
          },
          position: { x: 100 + (coordIndex * 200), y: coordinatorY },
          style: {
            background: 'hsl(var(--coordinator) / 0.1)',
            border: '2px solid hsl(var(--coordinator))',
            borderRadius: '8px',
            width: 180,
          },
        });

        newEdges.push({
          id: `edge-panchayath-${panchayath.id}-${coordId}`,
          source: `panchayath-${panchayath.id}`,
          target: coordId,
          type: 'smoothstep',
          style: { stroke: 'hsl(var(--coordinator))', strokeWidth: 2 },
        });
      });

      let supervisorY = coordinatorY + 150;
      
      // Supervisors
      panchayath.supervisors?.forEach((supervisor: any, supIndex: number) => {
        const supId = `supervisor-${supervisor.id}`;
        newNodes.push({
          id: supId,
          type: 'default',
          data: { 
            label: (
              <div className="text-center">
                <div className="font-semibold">{supervisor.name}</div>
                <div className="text-xs text-muted-foreground">Supervisor</div>
                {supervisor.wards && (
                  <div className="text-xs bg-supervisor text-white px-1 rounded">
                    Wards: {supervisor.wards.join(', ')}
                  </div>
                )}
              </div>
            )
          },
          position: { x: 150 + (supIndex * 250), y: supervisorY },
          style: {
            background: 'hsl(var(--supervisor) / 0.1)',
            border: '2px solid hsl(var(--supervisor))',
            borderRadius: '8px',
            width: 200,
          },
        });

        newEdges.push({
          id: `edge-panchayath-${panchayath.id}-${supId}`,
          source: `panchayath-${panchayath.id}`,
          target: supId,
          type: 'smoothstep',
          style: { stroke: 'hsl(var(--supervisor))', strokeWidth: 2 },
        });
      });

      let groupLeaderY = supervisorY + 150;
      
      // Group Leaders
      panchayath.group_leaders?.forEach((groupLeader: any, glIndex: number) => {
        const glId = `group-leader-${groupLeader.id}`;
        newNodes.push({
          id: glId,
          type: 'default',
          data: { 
            label: (
              <div className="text-center">
                <div className="font-semibold">{groupLeader.name}</div>
                <div className="text-xs text-muted-foreground">Group Leader</div>
                <div className="text-xs bg-group-leader text-white px-1 rounded">
                  Ward {groupLeader.ward_number}
                </div>
              </div>
            )
          },
          position: { x: 100 + (glIndex * 200), y: groupLeaderY },
          style: {
            background: 'hsl(var(--group-leader) / 0.1)',
            border: '2px solid hsl(var(--group-leader))',
            borderRadius: '8px',
            width: 180,
          },
        });

        // Connect group leaders to supervisors if supervisor covers their ward
        const relatedSupervisor = panchayath.supervisors?.find((sup: any) => 
          sup.wards?.includes(groupLeader.ward_number.toString())
        );
        
        if (relatedSupervisor) {
          newEdges.push({
            id: `edge-supervisor-${relatedSupervisor.id}-${glId}`,
            source: `supervisor-${relatedSupervisor.id}`,
            target: glId,
            type: 'smoothstep',
            style: { stroke: 'hsl(var(--group-leader))', strokeWidth: 2 },
          });
        }

        // PROs under this group leader
        const relatedPros = panchayath.pros?.filter((pro: any) => 
          pro.group_leader_id === groupLeader.id
        );

        relatedPros?.forEach((pro: any, proIndex: number) => {
          const proId = `pro-${pro.id}`;
          newNodes.push({
            id: proId,
            type: 'default',
            data: { 
              label: (
                <div className="text-center">
                  <div className="font-semibold">{pro.name}</div>
                  <div className="text-xs text-muted-foreground">PRO</div>
                </div>
              )
            },
            position: { x: 50 + (glIndex * 200) + (proIndex * 100), y: groupLeaderY + 120 },
            style: {
              background: 'hsl(var(--pro) / 0.1)',
              border: '2px solid hsl(var(--pro))',
              borderRadius: '8px',
              width: 150,
            },
          });

          newEdges.push({
            id: `edge-group-leader-${groupLeader.id}-${proId}`,
            source: glId,
            target: proId,
            type: 'smoothstep',
            style: { stroke: 'hsl(var(--pro))', strokeWidth: 2 },
          });
        });
      });

      yOffset += 800; // Space between panchayaths
    });

    setNodes(newNodes);
    setEdges(newEdges);
  };

  useEffect(() => {
    fetchChartData();
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading organizational chart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-96 w-full border rounded-lg overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        style={{ backgroundColor: "hsl(var(--background))" }}
      >
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
};