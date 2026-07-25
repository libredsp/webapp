import { NodeBase, BlockType } from './index';

export class Modifier extends NodeBase {
  constructor(id: string, x: number, y: number, std: number, mean: number, displayName = "Mod", width = 100, height = 50) {
    super(id, displayName, x, y, BlockType.MODIFIER, width, height);
    this.std = std;
    this.mean = mean;
  }

  std: number;
  mean: number;
  static defaultWidth = 100;
  static defaultHeight = 50;
  value: number;
  style = 'bg-teal-600';
}
