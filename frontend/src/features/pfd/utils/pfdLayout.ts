import ELK from 'elkjs/lib/elk-api.js';
import type { ProcessStep } from '../PfdWorkspace';
import { nodeHeight,nodeWidth,nodePortPoint,upgradePfdGraph,wrapPfdText } from './pfdGraph.ts';
import type { PfdGraph,PfdPort,PfdPoint } from './pfdGraph.ts';
interface Junction {id:string;point:PfdPoint;edgeIds:string[]}
const pointKey=(p:PfdPoint)=>`${p.x},${p.y}`;
function junctionPlan(graph:PfdGraph) {
  const shared=new Map<string,Junction>();
  for(const edge of graph.edges)for(const point of edge.junctions||[]){const key=pointKey(point);let item=shared.get(key);if(!item){let id=`pfd-junction-${shared.size}`;while(graph.nodes.some(n=>n.id===id))id+='-virtual';item={id,point,edgeIds:[]};shared.set(key,item);}if(!item.edgeIds.includes(edge.id))item.edgeIds.push(edge.id);}
  const segmentDistance=(point:PfdPoint,points:PfdPoint[])=>{let distance=0;for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];if((a.x===b.x&&point.x===a.x&&point.y>=Math.min(a.y,b.y)&&point.y<=Math.max(a.y,b.y))||(a.y===b.y&&point.y===a.y&&point.x>=Math.min(a.x,b.x)&&point.x<=Math.max(a.x,b.x)))return distance+Math.abs(point.x-a.x)+Math.abs(point.y-a.y);distance+=Math.abs(b.x-a.x)+Math.abs(b.y-a.y);}return -1;};
  const orphan=[...shared.values()].filter(j=>j.edgeIds.length<2||j.edgeIds.some(id=>segmentDistance(j.point,graph.edges.find(e=>e.id===id)?.points||[])<0));
  const valid=[...shared.values()].filter(j=>!orphan.includes(j));
  const byEdge=new Map(graph.edges.map(edge=>[edge.id,valid.filter(j=>j.edgeIds.includes(edge.id)).sort((a,b)=>segmentDistance(a.point,edge.points||[])-segmentDistance(b.point,edge.points||[]))]));
  return {valid,byEdge,orphan};
}
export function layoutInput(graph:PfdGraph,steps:ProcessStep[],direction:'horizontal'|'vertical') {
  const sides:PfdPort[]=['north','east','south','west'],plan=junctionPlan(graph);
  if(plan.orphan.length)throw new Error(`${plan.orphan.length} junctions lack shared explicit incident routes or matching geometry. Review junctions manually before automatic layout. Current drawing is unchanged.`);
  const port=(id:string,side:PfdPort)=>`${id}::${side}`;
  const children=[...graph.nodes.filter(n=>n.kind!=='annotation').map(n=>({id:n.id,width:nodeWidth(n,direction),height:nodeHeight(n,steps,direction),layoutOptions:{'elk.portConstraints':'FIXED_POS'},ports:sides.map(side=>{const p=nodePortPoint({...n,x:0,y:0},side,steps,graph.displayMode,direction);return{id:port(n.id,side),x:p.x,y:p.y,width:0,height:0,layoutOptions:{'elk.port.side':side.toUpperCase()}};})})),
    ...plan.valid.map(j=>({id:j.id,width:8,height:8,layoutOptions:{'elk.portConstraints':'FIXED_POS'},ports:sides.map(side=>({id:port(j.id,side),x:4,y:4,width:0,height:0,layoutOptions:{'elk.port.side':side.toUpperCase()}}))}))];
  const edges=graph.edges.flatMap(edge=>{
    const joins=plan.byEdge.get(edge.id)||[],sources=[edge.source,...joins.map(j=>j.id)],targets=[...joins.map(j=>j.id),edge.target];
    return sources.map((source,i)=>({id:joins.length?`${edge.id}::part-${i}`:edge.id,sources:[port(source,i===0?edge.sourcePort||(direction==='horizontal'?'east':'south'):direction==='horizontal'?'east':'south')],targets:[port(targets[i],i===sources.length-1?edge.targetPort||(direction==='horizontal'?'west':'north'):direction==='horizontal'?'west':'north')],labels:edge.label&&i===0?[{id:`${edge.id}-label`,text:edge.label,width:200,height:wrapPfdText(edge.label,27).length*16}]:[]}));
  });
  return {id:'pfd',layoutOptions:{'elk.algorithm':'layered','elk.direction':direction==='horizontal'?'RIGHT':'DOWN','elk.edgeRouting':'ORTHOGONAL','elk.spacing.nodeNode':'65','elk.layered.spacing.nodeNodeBetweenLayers':'110','elk.padding':'[top=60,left=40,bottom=60,right=40]','elk.layered.considerModelOrder.strategy':'NODES_AND_EDGES'},children,edges};
}
export interface LayoutResult {children?:{id:string;x?:number;y?:number;width?:number;height?:number}[];edges?:{id:string;sections?:{startPoint:{x:number;y:number};endPoint:{x:number;y:number};bendPoints?:{x:number;y:number}[]}[];labels?:{x?:number;y?:number}[]}[]}
export function applyLayoutResult(graph:PfdGraph,result:LayoutResult,direction:'horizontal'|'vertical',steps:ProcessStep[]=[]):PfdGraph {
  const nodes=new Map(result.children?.map(n=>[n.id,n])||[]),edges=new Map(result.edges?.map(e=>[e.id,e])||[]),plan=junctionPlan(graph);
  return {...upgradePfdGraph(graph),layoutDirection:direction,reviewStatus:'draft',nodes:graph.nodes.map(n=>{const placed=nodes.get(n.id);return placed?{...n,x:placed.x??n.x,y:placed.y??n.y,width:placed.width,height:placed.height}:n;}),edges:graph.edges.map(e=>{
    const joins=plan.byEdge.get(e.id)||[],parts=joins.length?Array.from({length:joins.length+1},(_,i)=>edges.get(`${e.id}::part-${i}`)):[edges.get(e.id)];
    const points=parts.flatMap(part=>part?.sections?.flatMap(s=>[s.startPoint,...s.bendPoints||[],s.endPoint])||[]).filter((p,i,a)=>i===0||p.x!==a[i-1].x||p.y!==a[i-1].y),label=parts[0]?.labels?.[0];
    // ELK routes to node bounds; extend through reserved whitespace to the actual symbol ports.
    for(const [index,id,side] of [[0,e.source,e.sourcePort||(direction==='horizontal'?'east':'south')],[points.length-1,e.target,e.targetPort||(direction==='horizontal'?'west':'north')]] as const){
      const original=graph.nodes.find(n=>n.id===id),placed=nodes.get(id);if(original&&placed&&points.length){const actual=nodePortPoint({...original,x:placed.x||0,y:placed.y||0},side,steps,graph.displayMode,direction);points[index]=actual;}
    }
    const junctions=joins.map(j=>{const node=nodes.get(j.id);return node?{x:(node.x||0)+4,y:(node.y||0)+4}:j.point;});
    return {...e,sourcePort:e.sourcePort||(direction==='horizontal'?'east':'south'),targetPort:e.targetPort||(direction==='horizontal'?'west':'north'),points:points.length?points:undefined,junctions:junctions.length?junctions:undefined,labelPosition:label&&label.x!==undefined&&label.y!==undefined?{x:label.x,y:label.y+12}:undefined};
  })};
}
export const PFD_LAYOUT_TIMEOUT_MS=30000;
export function createLayoutJob(graph:PfdGraph,steps:ProcessStep[],direction:'horizontal'|'vertical') {
  let input:ReturnType<typeof layoutInput>;
  try{input=layoutInput(graph,steps,direction);}catch(error){return {promise:Promise.reject<PfdGraph>(error),cancel:()=>{}};}
  let worker:Worker;try{worker=new Worker(new URL('./pfdLayout.worker.ts',import.meta.url),{type:'module'});}catch(error){return {promise:Promise.reject<PfdGraph>(error),cancel:()=>{}};}
  let rejectJob:((error:Error)=>void)|undefined,settled=false;
  let timer:ReturnType<typeof setTimeout>|undefined;
  const finish=()=>{settled=true;if(timer)clearTimeout(timer);worker.terminate();};
  const promise=new Promise<PfdGraph>((resolve,reject)=>{
    rejectJob=(error)=>{if(settled)return;finish();reject(error);};
    timer=setTimeout(()=>rejectJob?.(new Error('Automatic layout timed out. Your current drawing and unsaved edits are unchanged. Try a smaller diagram or arrange it manually.')),PFD_LAYOUT_TIMEOUT_MS);
    worker.onerror=()=>rejectJob?.(new Error('Automatic layout worker failed to load or run. Your current drawing is unchanged.'));
    worker.onmessageerror=()=>rejectJob?.(new Error('Automatic layout returned an unreadable response. Your current drawing is unchanged.'));
    try{
      // The main-thread API manages ELK's register/layout request IDs. The heavy engine stays in our local worker.
      const elk=new ELK({workerFactory:()=>worker});
      elk.layout(input).then(result=>{if(settled)return;finish();resolve(applyLayoutResult(graph,result as unknown as LayoutResult,direction,steps));},error=>rejectJob?.(error instanceof Error?error:new Error(String(error))));
    }catch(error){rejectJob?.(error instanceof Error?error:new Error(String(error)));}
  });
  return {promise,cancel:()=>rejectJob?.(new Error('Layout cancelled. Current drawing is unchanged.'))};
}
