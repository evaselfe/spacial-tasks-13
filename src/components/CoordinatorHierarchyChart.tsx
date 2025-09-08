import { useEffect, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CoordinatorHierarchyChartProps {
  panchayathId: string | null;
}

export const CoordinatorHierarchyChart = ({ panchayathId }: CoordinatorHierarchyChartProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchChartData = async () => {
    if (!panchayathId) return;

    try {
      const { data: panchayath, error: panchayathError } = await supabase
        .from("panchayaths")
        .select(`
          id,
          name,
          coordinators:coordinators(id, name, rating, ward),
          supervisors:supervisors(id, name, supervisor_wards(ward)),
          group_leaders:group_leaders(id, name, ward),
          pros:pros(id, name, group_leader_id, ward)
        `)
        .eq('id', panchayathId)
        .single();

      if (panchayathError) throw panchayathError;

      if (panchayath) {
        generateChartNodes([panchayath]);
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

    const panchayath = data[0];
    
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
      position: { x: 400, y: 0 },
      style: {
        background: 'hsl(var(--primary) / 0.1)',
        border: '2px solid hsl(var(--primary))',
        borderRadius: '8px',
        width: 200,
      },
    });

    let coordinatorY = 150;
    
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
              <div className="text-xs">Ward {coordinator.ward}</div>
              {coordinator.rating && (
                <div className="text-xs bg-primary text-primary-foreground px-1 rounded">
                  ★ {coordinator.rating}
                </div>
              )}
            </div>
          )
        },
        position: { x: 100 + (coordIndex * 200), y: coordinatorY },
        style: {
          background: 'hsl(var(--primary) / 0.1)',
          border: '2px solid hsl(var(--primary))',
          borderRadius: '8px',
          width: 180,
        },
      });

      newEdges.push({
        id: `edge-panchayath-${panchayath.id}-${coordId}`,
        source: `panchayath-${panchayath.id}`,
        target: coordId,
        type: 'smoothstep',
        style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
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
              {supervisor.supervisor_wards && supervisor.supervisor_wards.length > 0 && (
                <div className="text-xs bg-blue-500 text-white px-1 rounded">
                  Wards: {supervisor.supervisor_wards.map((sw: any) => sw.ward).join(', ')}
                </div>
              )}
            </div>
          )
        },
        position: { x: 150 + (supIndex * 250), y: supervisorY },
        style: {
          background: 'hsl(211 100% 95%)',
          border: '2px solid hsl(211 100% 50%)',
          borderRadius: '8px',
          width: 200,
        },
      });

      newEdges.push({
        id: `edge-panchayath-${panchayath.id}-${supId}`,
        source: `panchayath-${panchayath.id}`,
        target: supId,
        type: 'smoothstep',
        style: { stroke: 'hsl(211 100% 50%)', strokeWidth: 2 },
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
              <div className="text-xs bg-green-500 text-white px-1 rounded">
                Ward {groupLeader.ward}
              </div>
            </div>
          )
        },
        position: { x: 100 + (glIndex * 200), y: groupLeaderY },
        style: {
          background: 'hsl(142 76% 95%)',
          border: '2px solid hsl(142 76% 36%)',
          borderRadius: '8px',
          width: 180,
        },
      });

      // Connect group leaders to supervisors if supervisor covers their ward
      const relatedSupervisor = panchayath.supervisors?.find((sup: any) => 
        sup.supervisor_wards?.some((sw: any) => sw.ward === groupLeader.ward)
      );
      
      if (relatedSupervisor) {
        newEdges.push({
          id: `edge-supervisor-${relatedSupervisor.id}-${glId}`,
          source: `supervisor-${relatedSupervisor.id}`,
          target: glId,
          type: 'smoothstep',
          style: { stroke: 'hsl(142 76% 36%)', strokeWidth: 2 },
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
                <div className="text-xs bg-orange-500 text-white px-1 rounded">
                  Ward {pro.ward}
                </div>
              </div>
            )
          },
          position: { x: 50 + (glIndex * 200) + (proIndex * 100), y: groupLeaderY + 120 },
          style: {
            background: 'hsl(24 95% 95%)',
            border: '2px solid hsl(24 95% 53%)',
            borderRadius: '8px',
            width: 150,
          },
        });

        newEdges.push({
          id: `edge-group-leader-${groupLeader.id}-${proId}`,
          source: glId,
          target: proId,
          type: 'smoothstep',
          style: { stroke: 'hsl(24 95% 53%)', strokeWidth: 2 },
        });
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  };

  useEffect(() => {
    fetchChartData();
  }, [panchayathId]);

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