import { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { Generator, Modifier, FSFilter, BlockType, Display, Sum, NodeBase, DiscretePID } from '../NodeTypes';
import { Plant } from "../NodeTypes/Plant";
import { Line } from 'react-chartjs-2';

export const NodeConfigurePopup = ({ isOpen, onClose, incomingPorts, node, setNodes }) => {
    // Step
    const [genType, setGenType] = useState("step");
    const [stepAmplitude, setStepAmplitude] = useState<number>(0);

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
        if (node instanceof Plant) {
            setNum(node.num);
            setDen(node.den);
            setNumStr(node.num.join(' '));
            setDenStr(node.den.join(' '));
        }
        if (node instanceof Generator) {
            setStepAmplitude(node.value);
        }
        if (node instanceof Sum) {
            setSumMap(node.getSign());
        }
        if (node instanceof DiscretePID) {
            setKd(node.Kd);
            setKi(node.Ki);
            setKp(node.Kp);
            setIntegralMax(node.integral_max);
            setIntegralMin(node.integral_min);
        }
        if (node instanceof Modifier) {
            setStd(node.std);
            setMean(node.mean);
        }
        if (node instanceof FSFilter) {
            setFilterNum(node.num);
            setFilterDen(node.den);
        }
    }, []);

    useEffect(() => {
        if (node instanceof Generator) {
            setStepAmplitude(node.value);
        }
        if (node.displayName == "🖥️") {
            setGraphData({
                labels: node.graphX,
                datasets: [
                    {
                        label: "Y",
                        data: node.graphY,
                        borderColor: 'rgba(17, 16, 16, 1)',
                        borderWidth: 2,
                        fill: false,
                    },
                ],
            });

        }
        if (node instanceof Plant) {
            setNum(node.num);
            setDen(node.den);
        }
        if (node instanceof Sum) {
            setSumMap(node.getSign());
        }
        if (node instanceof DiscretePID) {
            setKd(node.Kd);
            setKi(node.Ki);
            setKp(node.Kp);
            setIntegralMax(node.integral_max);
            setIntegralMin(node.integral_min);
        }
        if (node instanceof Modifier) {
            setStd(node.std);
            setMean(node.mean);
        }
        if (node instanceof FSFilter) {
            setFilterNum(node.num);
            setFilterDen(node.den);
        }
    }, [node]);


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

    const parseArray = (s: string) => {
        return s.split(' ')
            .map(s => s.trim())
            .filter(s => s !== '' && !isNaN(Number(s)))
            .map(Number);
    }

    return ReactDOM.createPortal(
        <div style={styles.overlay}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}>
            <div style={styles.modal}>

                {/* Generator */}
                {node instanceof Generator && (
                    <select
                        value={genType}
                        onChange={(e) => { setGenType(e.target.value); }}
                        className="w-full px-2 py-1 rounded border border-gray-300 bg-white text-gray-800 text-sm focus:outline-none focus:border-gray-500"
                    >
                        <option value="step">Step</option>
                    </select>
                )}
                {node instanceof Generator && genType == "step" && (
                    <div className="flex rounded p-2">
                        <label className="mr-3 mt-1" htmlFor="amplitude">Amplitude</label>
                        <input
                            type="number"
                            value={stepAmplitude}
                            onChange={e => {
                                const tmp = Number(e.target.value);
                                setStepAmplitude(tmp);
                                node.value = tmp;
                                setNodes(prev => prev.map(n => n.id === node.id ? node : n));
                            }}
                            className="w-full border-gray-400 border rounded p-1"
                        />
                    </div>
                )}


                {/* Plant  */}
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
                    </div>)}

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

const styles: {
    overlay: React.CSSProperties;
    modal: React.CSSProperties;
    buttonRow: React.CSSProperties;
    tfFields: React.CSSProperties;
    sumFields: React.CSSProperties;
} = {
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
