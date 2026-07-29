import { DiscretePID, Display, Edge, Generator, NodeBase, FSFilter } from './NodeTypes';
import { Plant } from './NodeTypes/Plant';
import { Signal } from './NodeTypes/Signal';
import { BlockType } from './NodeTypes';
import { simulate_graph_wasm } from '@libredsp/core'

type UISign = boolean | "+" | "-";

interface UIEdge {
    from: NodeBase;
    to: NodeBase;
    fromPos?: number;
    toPos?: number;
}

interface NodeSpecification {
    id: string;
    type: string;
    params: Record<string, unknown>;
}

interface EdgeSpecification {
    from: string;
    to: string;
}

interface GraphSpecJson {
    nodes: NodeSpecification[];
    edges: EdgeSpecification[];
    simulation: { steps: number };
}

function normalizeSign(s: UISign): "+" | "-" {
    if (s === "+" || s === "-") return s;
    return s ? "+" : "-";
}

function toNodeSpecification(node: NodeBase, Ts: number): NodeSpecification {
    const n = node as any;

    switch (node.type) {
        case BlockType.GENERATOR:
            return { id: n.id, type: "Generator", params: { ...n.generatorType } };

        case BlockType.SUM: {
            const raw = n.sumSigns as Map<string, UISign>;
            const signs: Record<string, "+" | "-"> = {};
            raw.forEach((sign, refId) => {
                signs[refId] = normalizeSign(sign);
            });
            return { id: n.id, type: "Sum", params: { signs } };
        }

        case BlockType.DISCRETE_PID:
            return {
                id: n.id,
                type: "DiscretePID",
                params: {
                    kp: n.Kp,
                    ki: n.Ki,
                    kd: n.Kd,
                    dt: Ts,
                    out_max: n.integral_max,
                    out_min: n.integral_min,
                },
            };

        case BlockType.PLANT:
            return {
                id: n.id,
                type: "Plant",
                params: {
                    transfer_function: { num: n.num, den: n.den },
                    sampling_period: Ts,
                    dt: n.dt,
                },
            };

        case BlockType.FSFILTER:
            return {
                id: n.id,
                type: "Filter",
                params: {
                    transfer_function: {
                        num: n.num ?? [1],
                        den: n.den ?? [1],
                    },
                },
            };

        case BlockType.MODIFIER:
            return {
                id: n.id,
                type: "Modifier",
                params: { mean: n.mean, std_dev: n.std },
            };

        case BlockType.DISPLAY:
            return {
                id: n.id,
                type: "Display",
                params: n.outputFile ? { output_file: n.outputFile } : {},
            };

        default:
            throw new Error(`unknown node type: ${node.type}`);
    }
}

function orderNodesForSpecification(nodes: NodeBase[]): NodeBase[] {
    const sums = nodes.filter(n => n.type === BlockType.SUM);
    const nonSums = nodes.filter(n => n.type !== BlockType.SUM);
    return [...nonSums, ...sums];
}

export function toGraphSpecification(
    nodes: NodeBase[],
    edges: UIEdge[],
    steps: number,
    Ts: number
): GraphSpecJson {
    const ordered = orderNodesForSpecification(nodes);
    return {
        nodes: ordered.map(n => toNodeSpecification(n, Ts)),
        edges: edges.map((e) => ({ from: e.from.id, to: e.to.id })),
        simulation: { steps },
    };
}

export const simulate = (
    nodes: NodeBase[],
    edges: Edge[],
    setNodes: any,
    Ts = 0.01,
    simulationSteps = 100,
    setSimFinishTrigger
) => {
    validate(nodes, edges);

    const spec = toGraphSpecification(nodes, edges, simulationSteps, Ts);
    console.log(spec)
    const json = JSON.stringify(spec);
    const result = simulate_graph_wasm(json) as Map<string, number[]>;
    const updatedNodes = nodes.map(node => {
        const values = result.get(node.id);
        if (node.type === BlockType.DISPLAY && values) {
            const copy = Object.create(Object.getPrototypeOf(node));
            Object.assign(copy, node);
            copy.graphY = values;
            copy.graphX = values.map((_, i) => Math.round(i * Ts * 100) / 100);
            return copy;
        }
        return node;
    });
    setNodes(updatedNodes);
    setSimFinishTrigger((_) => true);
    return result;
};

function validate(nodes: NodeBase[], edges: Edge[]) {
    // Only one continuous Plant allowed
    let numOfPlants = nodes.filter(n => n instanceof Plant).length;
    if (numOfPlants > 1) throw new Error("Only one continuous plant is allowed.");

    // Display and DiscretePID should only have one input
    nodes.forEach(n => {
        if ((n instanceof Display || n instanceof DiscretePID) && n.inDegree > 1) {
            throw new Error(`${n.constructor.name} should only have one input.`);
        }
    });
}
