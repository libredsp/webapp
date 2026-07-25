import { NodeBase, BlockType } from './index';

export class Sum extends NodeBase {
    sumSigns: Map<string, "+" | "-"> = new Map();

    constructor(id: string, x: number, y: number, displayName = "Sum", width = 50, height = 50) {
        super(id, displayName, x, y, BlockType.SUM, width, height);
    }

    setSign(nodeId: string, sign: "+" | "-") {
        this.sumSigns.set(nodeId, sign);
    }

    getSign() {
        return this.sumSigns;
    }

    static defaultWidth = 50;
    static defaultHeight = 50;
    style = 'bg-red-600';
}