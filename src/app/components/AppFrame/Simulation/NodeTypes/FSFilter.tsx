import { NodeBase, BlockType } from './index';
import { Signal } from './Signal';

export class FSFilter extends NodeBase {
  y_buffer: number[];
  x_buffer: number[];
  den: number[] = [1];
  num: number[] = [1];
  static defaultWidth = 100;
  static defaultHeight = 50;
  style = 'bg-teal-600';

  constructor(
    id: string,
    x: number,
    y: number,
    den: number[] = [1],
    num: number[] = [1],
    displayName = "Filter",
    width = FSFilter.defaultWidth,
    height = FSFilter.defaultHeight
  ) {
    super(id, displayName, x, y, BlockType.FSFILTER, width, height);
    this.den = den;
    this.num = num;
  }
}
