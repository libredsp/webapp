"use client";
import React, { useEffect, useRef, useState } from 'react'
import { Line } from 'react-chartjs-2';
import { ConfigurePopup } from './ConfigurePopup';
import { filter } from '../../core';
import Button from '../../ui/Button';

export const FilterTest = ({ filterCoefficients }) => {
  const [filteredOutput, setFilteredOutput] = useState([]);
  const [addNoiseChecked, setAddNoiseChecked] = useState(true);
  const [isConfigurePopupOpen, setIsConfigurePopupOpen] = useState(false);

  const [noiseMean, setNoiseMean] = useState<number>(1.0);
  const [noiseStandardDeviation, setNoiseStandardDeviation] = useState<number>(0.1);
  const [signalPeak, setSignalPeak] = useState<number>(1.0);

  const [testAudio, setTestAudio] = useState(false);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(() => {
    if (typeof window !== "undefined") {
      // only runs in browser. This prevents seeing error on cli.
      return new (window.AudioContext)();
    }
    return null;
  }); const [outBuffer, setOutBuffer] = useState(null);
  const audioRef = useRef(null); // to be able to stop music after it's played

  const toggleConfigurePopup = () => {
    setIsConfigurePopupOpen(!isConfigurePopupOpen);
  };

  const [selectedTestSignals, setSelectedTestSignals] = useState({
    "sine": true,
    "delta": false,
    "square": false,
    "triangle": false,
    "noise": false
  });

  const [data, setData] = useState(
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

  const plot = (value, filterCoefficients, addNoiseChecked) => {
    switch (value) {
      case "no_signal":
        plotOutput(new Array(100).fill(0), filterCoefficients);
        break;
      case "sine":
        plotOutput(addNoiseChecked ? addSignals(generateSineSignal(100), generateGaussianNoise(100)) : generateSineSignal(100), filterCoefficients);
        break;
      case "delta":
        plotOutput(addNoiseChecked ? addSignals(generateDeltaFunction(100), generateGaussianNoise(100)) : generateDeltaFunction(100), filterCoefficients);
        break;
      case "square":
        plotOutput(addNoiseChecked ? addSignals(generateSquareWaveSignal(100), generateGaussianNoise(100)) : generateSquareWaveSignal(100), filterCoefficients);
        break;
      case "triangle":
        plotOutput(addNoiseChecked ? addSignals(generateTriangleSignal(100), generateGaussianNoise(100)) : generateTriangleSignal(100), filterCoefficients);
    }
  }
  const handleAddNoise = () => {
    const value = Object.entries(selectedTestSignals).find(([key, value]) => value === true)[0];
    setAddNoiseChecked(!addNoiseChecked);
    plot(value, filterCoefficients, !addNoiseChecked);
  }

  const handleTestSignalSelect = (e) => {
    const value = e.target.value;

    setSelectedTestSignals((prev) => {
      let newState = { ...prev };
      for (const [key, _] of Object.entries(newState)) {
        newState[key] = false;
      }

      newState[value] = true;
      return newState;
    })
    plot(value, filterCoefficients, addNoiseChecked);
  };

  const options = {
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

  // Generate Gaussian noise via the Box-Muller method
  const generateGaussianNoise = (size) => {
    let mean = parseFloat(noiseMean.toString()); // I still don't know why this is needed.
    let standardDeviation = noiseStandardDeviation;
    let output = [];
    for (let i = 0; i < size; i++) {
      let u1 = Math.random();
      let u2 = Math.random();
      let z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      output.push(mean + z0 * standardDeviation);
    }
    return output;
  }

  /*
  A function to generate Sine signals
  */
  const generateSineSignal = (size) => {
    let output = [];
    let peak = signalPeak;
    for (let i = 0; i < size; i++) {
      output.push(peak * Math.sin(i * 0.1));
    }
    return output;
  }

  const generateSquareWaveSignal = (size, number_of_highs = 5) => {
    let output = [];
    let peak = signalPeak;
    for (let i = 0; i < number_of_highs; i++) {
      for (let j = 0; j < size / number_of_highs; j++) {
        if (i % 2 == 0) {
          output.push(peak);
        } else {
          output.push(0);
        }
      }
    }
    return output;
  }

  const generateTriangleSignal = (size) => {
    let output = [];
    let tmp = 0;
    let peak = signalPeak;
    const incrementValue = 0.1;
    let upwardIncrease = true;

    for (let i = 0; i < size; i++) {
      output.push(tmp);

      if (upwardIncrease) {
        tmp += incrementValue;
        if (tmp > peak) {
          tmp = peak;
          upwardIncrease = false;
        }
      } else {
        tmp -= incrementValue;
        if (tmp < 0) {
          tmp = 0;
          upwardIncrease = true;
        }
      }
    }
    return output;
  };

  const generateDeltaFunction = (size) => {
    let output = [];
    for (let i = 0; i < size; i++) {
      output.push(0);
    }
    output[output.length / 2] = signalPeak;
    return output;
  }

  const addSignals = (s1: any[], s2: any[]) => {
    console.assert(s1.length == s2.length);
    let output = [];
    for (let i = 0; i < s1.length; i++) {
      output.push(s1[i] + s2[i]);
    }
    return output;
  }

  const plotOutput = (inputSignal, filterCoefficients) => {
    const filteredOutput = filter(inputSignal, filterCoefficients);
    setFilteredOutput(filteredOutput);
    let inputIndex = Array.from({ length: 100 }, (v, j) => j);

    setData({
      labels: inputIndex,
      datasets: [
        {
          label: "Generated signal",
          data: inputSignal,
          borderColor: 'rgba(255, 0, 0, 1)',
          borderWidth: 2,
          fill: false,
        },
        {
          label: "Filtered signal",
          data: filteredOutput,
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2,
          fill: false,
        },
      ],
    });

  }

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    const input = audioBuffer.getChannelData(0);

    // Filter
    const output = filter(input, filterCoefficients);

    // Normalize output
    let peak = 0;
    for (let i = 0; i < output.length; i++) {
      if (Math.abs(output[i]) > peak) peak = Math.abs(output[i]);
    }
    const scale = peak > 0 ? 1 / peak : 1; // ensures not doing 1/0
    const normalizedOutput = output.map(s => s * scale);

    const outBuffer = audioCtx.createBuffer(
      1,
      normalizedOutput.length,
      audioBuffer.sampleRate
    );
    outBuffer.copyToChannel(new Float32Array(normalizedOutput), 0);
    setOutBuffer(outBuffer);
  };

  const playMusicHandle = () => {
    if (audioRef.current) {
      audioRef.current.stop();
      audioRef.current.disconnect();
      audioRef.current = null;
    } else {
      const src = audioCtx.createBufferSource();
      src.buffer = outBuffer;
      src.connect(audioCtx.destination);
      audioRef.current = src;
      src.start();
      console.log("Done!");
    }

  }

  useEffect(() => {
    if (filterCoefficients.den.length == 0 && filterCoefficients.num.length == 0)
      plot("no_signal", filterCoefficients, addNoiseChecked);
    else {
      const generatedSignal = addNoiseChecked ? addSignals(generateSineSignal(100), generateGaussianNoise(100)) : generateSineSignal(100);
      const value = Object.entries(selectedTestSignals).find(([key, value]) => value === true)[0];
      const filteredOutput = filter(generatedSignal, filterCoefficients);
      setFilteredOutput(filteredOutput);
      plot(value, filterCoefficients, addNoiseChecked);

    }

  }, [filterCoefficients, noiseMean, noiseStandardDeviation, signalPeak]);


  return (
    <div className='bg-gray-50 p-2 my-5 mx-2 rounded-2xl shadow-md' style={{ height: '475px', width: '515px' }}>
      {testAudio && (
        <div>
          <div className="flex col h-[310px] justify-center mt-[100px]">
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-3">Select a WAV file</h2>
              <input
                type="file"
                accept="audio/wav"
                onChange={handleFile}
                className="text-sm text-gray-700 border border-gray-300 rounded-md p-2 mb-4 cursor-pointer
                            bg-white hover:bg-gray-50
                            focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400
                            transition-colors duration-150"
              />

              <Button onClick={playMusicHandle} text="Play" />
            </div>

          </div>
          <div className="flex justify-between">
            <div className="mt-2 ml-1">
            </div>
            <Button text="Test Audio" onClick={() => { setTestAudio(!testAudio) }} color="gray" />

          </div>
        </div>
      )}
      {!testAudio && (
        <div>
          <Line className="mx-2" data={data} options={options} height={200} />
          <div className="my-4">
            <div className="flex">
              <button
                value="sine"
                onClick={handleTestSignalSelect}
                className={`h-10 my-2 text-sm mx-2 px-5 ${selectedTestSignals["sine"]
                  ? "bg-slate-500 text-white"
                  : "bg-slate-200 text-black"
                  } rounded-lg hover:bg-gray-400`}
              >
                Sine
              </button>

              <button
                value="delta"
                onClick={handleTestSignalSelect}
                className={`h-10 my-2 text-sm mx-2 px-5 ${selectedTestSignals["delta"]
                  ? "bg-slate-500 text-white"
                  : "bg-slate-200 text-black"
                  } rounded-lg hover:bg-gray-400`}
              >
                Delta
              </button>

              <button
                value="square"
                onClick={handleTestSignalSelect}
                className={`h-10 my-2 text-sm mx-2 px-5 ${selectedTestSignals["square"]
                  ? "bg-slate-500 text-white"
                  : "bg-slate-200 text-black"
                  } rounded-lg hover:bg-gray-400`}
              >
                Square
              </button>

              <button
                value="triangle"
                onClick={handleTestSignalSelect}
                className={`h-10 my-2 text-sm mx-2 px-5 ${selectedTestSignals["triangle"]
                  ? "bg-slate-500 text-white"
                  : "bg-slate-200 text-black"
                  } rounded-lg hover:bg-gray-400`}
              >
                Triangle
              </button>

              <button
                value="configure"
                onClick={toggleConfigurePopup}
                className="h-10 my-2 text-sm mx-2 px-5 bg-black text-white rounded-lg hover:bg-gray-800"
              >
                Configure
              </button>

              <ConfigurePopup
                isOpen={isConfigurePopupOpen}
                onClose={toggleConfigurePopup}
                peak={signalPeak}
                noiseMean={noiseMean}
                noiseSd={noiseStandardDeviation}
                updatePeak={(e) => setSignalPeak(e)}
                updateMean={(e) => setNoiseMean(e)}
                updateSd={(e) => setNoiseStandardDeviation(e)}
              />
            </div>
          </div>
          <div className="flex justify-between">
            <div className="mt-2 ml-1">
              <label>
                <input
                  className="mx-2 select-none"
                  type="checkbox"
                  checked={addNoiseChecked}
                  onChange={handleAddNoise}
                />
                <span className="text-gray-900">Add Gaussian Noise</span>
              </label>
            </div>
            <Button text="Test Audio" onClick={() => { setTestAudio(!testAudio) }} color="gray" />

          </div>

        </div>

      )}
    </div>

  );
}
