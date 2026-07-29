import { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { Generator, Modifier, FSFilter, BlockType, Display, Sum, NodeBase, DiscretePID } from '../NodeTypes';
import { Plant } from "../NodeTypes/Plant";
import { Line } from 'react-chartjs-2';

// Define generator types matching the backend
export type GeneratorType =
    | { type: 'sine'; n: number; amplitude: number; frequency: number; phase: number }
    | { type: 'pulse'; n: number; amplitude: number; frequency: number; duty_cycle: number }
    | { type: 'noise'; n: number; standard_deviation: number; mean: number }
    | { type: 'delta'; n: number; position: number }
    | { type: 'step'; n: number; amplitude: number; step_index: number };

export const NodeConfigurePopup = ({ isOpen, onClose, incomingPorts, node, setNodes }) => {
    // Generator state - now matching backend
    const [genType, setGenType] = useState<string>("sine");
    const [genN, setGenN] = useState<number>(100);
    const [genAmplitude, setGenAmplitude] = useState<number>(1);
    const [genFrequency, setGenFrequency] = useState<number>(1);
    const [genPhase, setGenPhase] = useState<number>(0);
    const [genDutyCycle, setGenDutyCycle] = useState<number>(0.5);
    const [genStdDev, setGenStdDev] = useState<number>(1);
    const [genMean, setGenMean] = useState<number>(0);
    const [genPosition, setGenPosition] = useState<number>(0);
    const [genStepIndex, setGenStepIndex] = useState<number>(0);

    // Plant
    const [num, setNum] = useState([]);
    const [den, setDen] = useState([]);
    const [numStr, setNumStr] = useState('');
    const [denStr, setDenStr] = useState('');

    // Sum
    const [sumMap, setSumMap] = useState<Map<string, "+" | "-">>(null)

    // D-PID
    const [Kp, setKp] = useState(0);
    const [Ki, setKi] = useState(0);
    const [Kd, setKd] = useState(0);
    const [integralMin, setIntegralMin] = useState(0);
    const [integralMax, setIntegralMax] = useState(0);

    // Mod
    const [std, setStd] = useState(0);
    const [mean, setMean] = useState(0);

    // Filter
    const [filterNum, setFilterNum] = useState([]);
    const [filterDen, setFilterDen] = useState([]);
    const [filterNumStr, setFilterNumStr] = useState('');
    const [filterDenStr, setFilterDenStr] = useState('');

    const [graphData, setGraphData] = useState(
        {
            labels: [],
            datasets: [
                {
                    label: '',
                    data: [],
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    fill: false,
                },
            ],
        }
    );

    const graphOptions = {
        scales: {
            x: {
                title: {
                    display: false,
                    text: '',
                },
            },
            y: {
                title: {
                    display: false,
                    text: '',
                },
            },
        },
    }

    useEffect(() => {
        if (node instanceof Generator && node.generatorType) {
            const genType = node.generatorType;
            setGenType(genType.type);

            switch (genType.type) {
                case 'sine':
                    setGenN(genType.n || 100);
                    setGenAmplitude(genType.amplitude || 1);
                    setGenFrequency(genType.frequency || 1);
                    setGenPhase(genType.phase || 0);
                    break;
                case 'pulse':
                    setGenN(genType.n || 100);
                    setGenAmplitude(genType.amplitude || 1);
                    setGenFrequency(genType.frequency || 1);
                    setGenDutyCycle(genType.duty_cycle || 0.5);
                    break;
                case 'noise':
                    setGenN(genType.n || 100);
                    setGenStdDev(genType.standard_deviation || 1);
                    setGenMean(genType.mean || 0);
                    break;
                case 'delta':
                    setGenN(genType.n || 100);
                    setGenPosition(genType.position || 0);
                    break;
            }
        }
    }, [node]);
    useEffect(() => {
        if (node.displayName === "🖥️" && node.graphX && node.graphY) {
            setGraphData({
                labels: node.graphX,
                datasets: [
                    {
                        label: node.id,
                        data: node.graphY,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 2,
                        fill: false,
                    },
                ],
            });
        }
    }, [node, node.graphX, node.graphY]);
    const updateGenerator = (updates: Partial<GeneratorType>) => {
        // If the update includes a new type, make sure to set it
        if (updates.type) {
            node.generatorType = {
                type: updates.type,
                n: genN,
                // Set defaults based on type
                ...(updates.type === 'sine' && { amplitude: genAmplitude, frequency: genFrequency, phase: genPhase }),
                ...(updates.type === 'pulse' && { amplitude: genAmplitude, frequency: genFrequency, duty_cycle: genDutyCycle }),
                ...(updates.type === 'noise' && { standard_deviation: genStdDev, mean: genMean }),
                ...(updates.type === 'delta' && { position: genPosition })

            };
        } else {
            // Just update existing fields
            node.generatorType = {
                ...node.generatorType,
                ...updates
            };
        }

        // Force update
        setNodes(prev => prev.map(n => n.id === node.id ? node : n));

        // Log to verify
        console.log('Updated generatorType:', node.generatorType);
    };

    const parseArray = (s: string) => {
        return s.split(' ')
            .map(s => s.trim())
            .filter(s => s !== '' && !isNaN(Number(s)))
            .map(Number);
    }

    if (!isOpen) return null;

    const handleSumChange = (sum: Sum, value: "+" | "-") => {
        setSumMap(p => {
            const updated = new Map(p);
            updated.set(sum.id, value);
            return updated;
        });

        setNodes(prev =>
            prev.map(nd => {
                if (nd.id !== node.id) return nd;
                const newNode = Object.create(Object.getPrototypeOf(nd));
                Object.assign(newNode, nd);
                newNode.setSign(sum.id, value);
                return newNode;
            })
        );
    };

    return ReactDOM.createPortal(
        <div style={styles.overlay}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}>
            <div style={styles.modal}>

                {/* Generator */}
                {node instanceof Generator && (
                    <div className="flex flex-col gap-2 p-2">
                        {/* Generator Type Selection */}
                        <div className="flex items-center gap-2">
                            <label className="font-medium">Type:</label>
                            <select
                                value={genType}
                                onChange={(e) => {
                                    const newType = e.target.value;
                                    setGenType(newType);

                                    // Update node directly
                                    node.generatorType = {
                                        type: newType as any,
                                        n: 100,
                                        ...(newType === 'sine' && { amplitude: 1, frequency: 1, phase: 0 }),
                                        ...(newType === 'pulse' && { amplitude: 1, frequency: 1, duty_cycle: 0.5 }),
                                        ...(newType === 'noise' && { standard_deviation: 1, mean: 0 }),
                                        ...(newType === 'delta' && { position: 0 }),
                                        ...(newType === 'step' && { amplitude: 1, step_index: 0 })
                                    };

                                    setNodes(prev => prev.map(n => n.id === node.id ? node : n));

                                    // Log to verify
                                    console.log('Type changed to:', newType, node.generatorType);
                                }}
                                className="w-full px-2 py-1 rounded border border-gray-300 bg-white text-gray-800 text-sm focus:outline-none focus:border-gray-500"
                            >

                                <option value="sine">Sine</option>
                                <option value="pulse">Pulse Train</option>
                                <option value="noise">White Noise</option>
                                <option value="delta">Delta</option>
                                <option value="step">Step</option>
                            </select>
                        </div>

                        {/* Common parameter: Number of samples */}
                        <div className="flex items-center gap-2">
                            <label className="font-medium">Samples (N):</label>
                            <input
                                type="number"
                                value={genN}
                                onChange={e => {
                                    const val = Number(e.target.value);
                                    setGenN(val);
                                    updateGenerator({ n: val });
                                }}
                                className="flex-1 border-gray-400 border rounded p-1"
                                min={1}
                            />
                        </div>
                        {genType === 'step' && (
                            <>
                                <div className="flex items-center gap-2">
                                    <label className="font-medium">Amplitude:</label>
                                    <input
                                        type="number"
                                        value={genAmplitude}
                                        onChange={e => {
                                            const val = Number(e.target.value);
                                            setGenAmplitude(val);
                                            updateGenerator({ amplitude: val });
                                        }}
                                        className="flex-1 border-gray-400 border rounded p-1"
                                        step={0.1}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="font-medium">Step Index:</label>
                                    <input
                                        type="number"
                                        value={genStepIndex}
                                        onChange={e => {
                                            const val = Math.max(0, Math.min(genN - 1, Number(e.target.value)));
                                            setGenStepIndex(val);
                                            updateGenerator({ step_index: val });
                                        }}
                                        className="flex-1 border-gray-400 border rounded p-1"
                                        min={0}
                                        max={genN - 1}
                                    />
                                </div>
                            </>
                        )}

                        {/* Sine-specific parameters */}
                        {genType === 'sine' && (
                            <>
                                <div className="flex items-center gap-2">
                                    <label className="font-medium">Amplitude:</label>
                                    <input
                                        type="number"
                                        value={genAmplitude}
                                        onChange={e => {
                                            const val = Number(e.target.value);
                                            setGenAmplitude(val);
                                            updateGenerator({ amplitude: val });
                                        }}
                                        className="flex-1 border-gray-400 border rounded p-1"
                                        step={0.1}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="font-medium">Frequency:</label>
                                    <input
                                        type="number"
                                        value={genFrequency}
                                        onChange={e => {
                                            const val = Number(e.target.value);
                                            setGenFrequency(val);
                                            updateGenerator({ frequency: val });
                                        }}
                                        className="flex-1 border-gray-400 border rounded p-1"
                                        step={0.1}
                                        min={0}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="font-medium">Phase:</label>
                                    <input
                                        type="number"
                                        value={genPhase}
                                        onChange={e => {
                                            const val = Number(e.target.value);
                                            setGenPhase(val);
                                            updateGenerator({ phase: val });
                                        }}
                                        className="flex-1 border-gray-400 border rounded p-1"
                                        step={0.1}
                                    />
                                </div>
                            </>
                        )}

                        {/* Pulse train-specific parameters */}
                        {genType === 'pulse' && (
                            <>
                                <div className="flex items-center gap-2">
                                    <label className="font-medium">Amplitude:</label>
                                    <input
                                        type="number"
                                        value={genAmplitude}
                                        onChange={e => {
                                            const val = Number(e.target.value);
                                            setGenAmplitude(val);
                                            updateGenerator({ amplitude: val });
                                        }}
                                        className="flex-1 border-gray-400 border rounded p-1"
                                        step={0.1}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="font-medium">Frequency:</label>
                                    <input
                                        type="number"
                                        value={genFrequency}
                                        onChange={e => {
                                            const val = Number(e.target.value);
                                            setGenFrequency(val);
                                            updateGenerator({ frequency: val });
                                        }}
                                        className="flex-1 border-gray-400 border rounded p-1"
                                        step={0.1}
                                        min={0}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="font-medium">Duty Cycle:</label>
                                    <input
                                        type="number"
                                        value={genDutyCycle}
                                        onChange={e => {
                                            const val = Number(e.target.value);
                                            setGenDutyCycle(Math.max(0, Math.min(1, val))); // Clamp between 0 and 1
                                            updateGenerator({ duty_cycle: Math.max(0, Math.min(1, val)) });
                                        }}
                                        className="flex-1 border-gray-400 border rounded p-1"
                                        step={0.05}
                                        min={0}
                                        max={1}
                                    />
                                </div>
                            </>
                        )}

                        {/* White noise-specific parameters */}
                        {genType === 'noise' && (
                            <>
                                <div className="flex items-center gap-2">
                                    <label className="font-medium">Std Deviation:</label>
                                    <input
                                        type="number"
                                        value={genStdDev}
                                        onChange={e => {
                                            const val = Number(e.target.value);
                                            setGenStdDev(Math.max(0, val));
                                            updateGenerator({ standard_deviation: Math.max(0, val) });
                                        }}
                                        className="flex-1 border-gray-400 border rounded p-1"
                                        step={0.1}
                                        min={0}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="font-medium">Mean:</label>
                                    <input
                                        type="number"
                                        value={genMean}
                                        onChange={e => {
                                            const val = Number(e.target.value);
                                            setGenMean(val);
                                            updateGenerator({ mean: val });
                                        }}
                                        className="flex-1 border-gray-400 border rounded p-1"
                                        step={0.1}
                                    />
                                </div>
                            </>
                        )}

                        {/* Delta-specific parameters */}
                        {genType === 'delta' && (
                            <div className="flex items-center gap-2">
                                <label className="font-medium">Position:</label>
                                <input
                                    type="number"
                                    value={genPosition}
                                    onChange={e => {
                                        const val = Number(e.target.value);
                                        setGenPosition(Math.max(0, Math.min(genN - 1, val)));
                                        updateGenerator({ position: Math.max(0, Math.min(genN - 1, val)) });
                                    }}
                                    className="flex-1 border-gray-400 border rounded p-1"
                                    min={0}
                                    max={genN - 1}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Plant */}
                {node instanceof Plant && (
                    <div>
                        <div className="flex rounded p-2">
                            <label className="mr-3 mt-1" htmlFor="num">Num:</label>
                            <input
                                type="text"
                                id="num"
                                className="w-full border-gray-400 border rounded p-1"
                                value={numStr}
                                onChange={(e) => {
                                    const raw = e.target.value;
                                    setNumStr(raw);
                                    const parsed = parseArray(raw);
                                    node.setNum(parsed);
                                    setNum(parsed);
                                }}
                            />
                        </div>
                        <div className="flex rounded p-2">
                            <label className="mr-4 mt-1" htmlFor="den">Den:</label>
                            <input
                                type="text"
                                id="den"
                                className="w-full border-gray-400 border rounded p-1"
                                value={denStr}
                                onChange={(e) => {
                                    const raw = e.target.value;
                                    setDenStr(raw);
                                    const parsed = parseArray(raw);
                                    node.setDen(parsed);
                                    setDen(parsed);
                                }}
                            />
                        </div>
                    </div>
                )}

                {node.displayName == "🖥️" && (
                    <Line className="mx-2" data={graphData} options={graphOptions} height={200} />
                )}

                {/* FSFilter */}
                {node instanceof FSFilter && (
                    <div>
                        <div className="flex rounded p-2">
                            <label className="mr-3 mt-1" htmlFor="num">Num:</label>
                            <input
                                type="text"
                                id="num"
                                className="w-full border-gray-400 border rounded p-1"
                                value={filterNumStr}
                                onChange={(e) => {
                                    const raw = e.target.value;
                                    setFilterNumStr(raw);
                                    const parsed = parseArray(raw);
                                    node.num = parsed;
                                    setFilterNum(parsed);
                                }}
                            />
                        </div>
                        <div className="flex rounded p-2">
                            <label className="mr-4 mt-1" htmlFor="den">Den:</label>
                            <input
                                type="text"
                                id="den"
                                className="w-full border-gray-400 border rounded p-1"
                                value={filterDenStr}
                                onChange={(e) => {
                                    const raw = e.target.value;
                                    setFilterDenStr(raw);
                                    const parsed = parseArray(raw);
                                    node.den = parsed;
                                    setFilterDen(parsed);
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Modifier */}
                {node instanceof Modifier && (
                    <div className="flex flex-col ml-3">
                        <div className="flex my-1">
                            <label className="my-1">Std:</label>
                            <input
                                className="w-full rounded border p-1 mr-5 ml-7"
                                type="number"
                                placeholder="Value"
                                value={std}
                                onChange={(e) => {
                                    const tmp = Number(e.target.value);
                                    setStd(tmp);
                                    node.std = tmp;
                                    setNodes(prev => prev.map(n => n.id === node.id ? node : n));
                                }}
                            />
                        </div>

                        <div className="flex my-1">
                            <label className="my-1">Mean:</label>
                            <input
                                className="w-full rounded border p-1 ml-3 mr-5"
                                type="number"
                                placeholder="Value"
                                value={mean}
                                onChange={(e) => {
                                    const tmp = Number(e.target.value);
                                    setMean(tmp);
                                    node.mean = tmp;
                                    setNodes(prev => prev.map(n => n.id === node.id ? node : n));
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Sum */}
                {node instanceof Sum && (
                    <div className="flex flex-col">
                        {incomingPorts.map((port) => (
                            <div key={port.id} className="flex justify-between mr-5 my-2">
                                <div>
                                    <label className="mr-2">Port:</label>
                                    <label className="ml-5 text-green-600">{port.id}</label>
                                </div>
                                <select
                                    className="rounded w-20 text-center"
                                    value={sumMap.get(port.id) ?? "+"}
                                    onChange={(e) => handleSumChange(port, e.target.value as "+" | "-")}
                                >
                                    <option value="+">+</option>
                                    <option value="-">-</option>
                                </select>
                            </div>
                        ))}
                    </div>
                )}

                {/* DiscretePID */}
                {node instanceof DiscretePID && (
                    <div className="flex flex-col">
                        <div className="flex my-1">
                            <label className="my-1">Kp:</label>
                            <input
                                className="w-full rounded border p-1 ml-3 mr-5"
                                type="number"
                                placeholder="Value"
                                value={Kp}
                                onChange={(e) => {
                                    const tmp = Number(e.target.value);
                                    setKp(tmp);
                                    node.Kp = tmp;
                                    setNodes(prev => prev.map(n => n.id === node.id ? node : n));
                                }}
                            />
                        </div>

                        <div className="flex my-1">
                            <label className="my-1">Ki:</label>
                            <input
                                className="w-full rounded border p-1 ml-4 mr-5"
                                type="number"
                                placeholder="Value"
                                value={Ki}
                                onChange={(e) => {
                                    const tmp = Number(e.target.value);
                                    setKi(tmp);
                                    node.Ki = tmp;
                                    setNodes(prev => prev.map(n => n.id === node.id ? node : n));
                                }}
                            />
                        </div>

                        <div className="flex my-1">
                            <label className="my-1">Kd:</label>
                            <input
                                className="w-full rounded border p-1 ml-3 mr-5"
                                type="number"
                                placeholder="Value"
                                value={Kd}
                                onChange={(e) => {
                                    const tmp = Number(e.target.value);
                                    setKd(tmp);
                                    node.Kd = tmp;
                                    setNodes(prev => prev.map(n => n.id === node.id ? node : n));
                                }}
                            />
                        </div>

                        <label className="my-1">Integral clamping</label>
                        <div className="flex my-1">
                            <label className="my-1">Min:</label>
                            <input
                                className="w-full rounded border p-1 ml-3 mr-5"
                                type="number"
                                placeholder="Value"
                                value={integralMin}
                                onChange={(e) => {
                                    const tmp = Number(e.target.value);
                                    setIntegralMin(tmp);
                                    node.integral_min = tmp;
                                    setNodes(prev => prev.map(n => n.id === node.id ? node : n));
                                }}
                            />

                            <label className="my-1">Max:</label>
                            <input
                                className="w-full rounded border p-1 ml-3 mr-5"
                                type="number"
                                placeholder="Value"
                                value={integralMax}
                                onChange={(e) => {
                                    const tmp = Number(e.target.value);
                                    setIntegralMax(tmp);
                                    node.integral_max = tmp;
                                    setNodes(prev => prev.map(n => n.id === node.id ? node : n));
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Buttons */}
                <div style={styles.buttonRow}>
                    <button
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

const styles: { overlay: React.CSSProperties; modal: React.CSSProperties; buttonRow: React.CSSProperties; tfFields: React.CSSProperties; sumFields: React.CSSProperties; } = {
    overlay: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999
    },
    modal: {
        background: "#fff",
        padding: 20,
        borderRadius: 8,
        width: 500,
    },
    buttonRow: {
        marginTop: 20,
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
    },
    tfFields: {
        display: "flex",
        flexDirection: "column",
        gap: 8,
        marginTop: 10,
    },
    sumFields: {
        display: "flex",
        flexDirection: "column",
        gap: 8,
        marginTop: 10,
    },
};