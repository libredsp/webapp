import { NodeBase, BlockType } from './index';
import type { Signal } from './Signal';

export class DiscretePID extends NodeBase {
  constructor(
    id: string,
    x: number,
    y: number,
    Kp = 2.0,
    Ki = 1.0,
    Kd = 0.01,
    Ts = 0.01,
    integral_max = 1,
    integral_min = -1,
    displayName = "D-PID",
    width = 100,
    height = 50
  ) {
    super(id, displayName, x, y, BlockType.DISCRETE_PID, width, height);
    this.Kp = Kp;
    this.Ki = Ki;
    this.Kd = Kd;
    this.Ts = Ts;
    this.integral_min = integral_min;
    this.integral_max = integral_max;
  }
  
  static defaultWidth = 100;
  static defaultHeight = 50;
  style = 'bg-teal-600';
  Kp: number;
  Ki: number;
  Kd: number;
  integral: number = 0;
  integral_max = Infinity;
  integral_min = -Infinity;
  e_prev: number = 0;
  Ts: number;
}
