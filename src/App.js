import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import WaveSurfer from 'wavesurfer.js';

function App() {
  const [baseFrequency, setBaseFrequency] = useState(300); // Base frequency in Hz (for the left ear)
  const [beatFrequency, setBeatFrequency] = useState(10);  // Beat frequency in Hz
  const [isPlaying, setIsPlaying] = useState(false);
  const [timer, setTimer] = useState(1500); // Set the initial timer to 25 minutes (1500 seconds)
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerDuration, setTimerDuration] = useState(25); // New state for timer duration in minutes
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const oscillatorLeftRef = useRef(null);
  const oscillatorRightRef = useRef(null);
  const gainNodeLeftRef = useRef(null);
  const gainNodeRightRef = useRef(null);
  const pannerLeftRef = useRef(null);
  const pannerRightRef = useRef(null);
  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);
  const [audioFile, setAudioFile] = useState(null);

  useEffect(() => {
    let wavesurfer = null;

    if (waveformRef.current && !wavesurferRef.current) {
      wavesurfer = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#4F4A85',
        progressColor: '#383351',
        cursorColor: '#383351',
        barWidth: 3,
        barRadius: 3,
        responsive: true,
        height: 100,
        normalize: true,
        partialRender: true,
      });

      wavesurfer.on('ready', function() {
        console.log('WaveSurfer is ready');
      });

      wavesurfer.on('error', function(e) {
        console.error('WaveSurfer error: ', e);
      });

      wavesurferRef.current = wavesurfer;
    }

    return () => {
      if (wavesurfer) {
        wavesurfer.destroy();
      }
    };
  }, []);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setAudioFile(file);
      if (wavesurferRef.current) {
        wavesurferRef.current.loadBlob(file);
      }
    }
  };

  const startBinauralBeats = () => {
    if (isPlaying) return;

    // Create a new audio context
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();
    audioContextRef.current = audioCtx;

    // Create oscillators for left and right ears
    const oscillatorLeft = audioCtx.createOscillator();
    const oscillatorRight = audioCtx.createOscillator();

    oscillatorLeft.type = 'sine';
    oscillatorRight.type = 'sine';

    oscillatorLeft.frequency.setValueAtTime(baseFrequency, audioCtx.currentTime); // Left ear
    oscillatorRight.frequency.setValueAtTime(baseFrequency + beatFrequency, audioCtx.currentTime); // Right ear

    // Create gain nodes to control volume
    const gainNodeLeft = audioCtx.createGain();
    const gainNodeRight = audioCtx.createGain();
    gainNodeLeft.gain.value = 0.5;
    gainNodeRight.gain.value = 0.5;

    // Create stereo panners
    const pannerLeft = audioCtx.createStereoPanner();
    const pannerRight = audioCtx.createStereoPanner();
    pannerLeft.pan.value = -1; // Left channel
    pannerRight.pan.value = 1; // Right channel

    // Connect the nodes
    oscillatorLeft.connect(gainNodeLeft);
    gainNodeLeft.connect(pannerLeft);
    pannerLeft.connect(audioCtx.destination);

    oscillatorRight.connect(gainNodeRight);
    gainNodeRight.connect(pannerRight);
    pannerRight.connect(audioCtx.destination);

    // Start the oscillators
    oscillatorLeft.start();
    oscillatorRight.start();

    // Save references for stopping
    oscillatorLeftRef.current = oscillatorLeft;
    oscillatorRightRef.current = oscillatorRight;
    gainNodeLeftRef.current = gainNodeLeft;
    gainNodeRightRef.current = gainNodeRight;
    pannerLeftRef.current = pannerLeft;
    pannerRightRef.current = pannerRight;

    // Start WaveSurfer playback only if an audio file is loaded
    if (wavesurferRef.current && audioFile) {
      wavesurferRef.current.play();
    }

    setIsPlaying(true);
  };

  const stopBinauralBeats = () => {
    if (!isPlaying) return;

    // Stop oscillators
    oscillatorLeftRef.current.stop();
    oscillatorRightRef.current.stop();

    // Disconnect nodes
    oscillatorLeftRef.current.disconnect();
    gainNodeLeftRef.current.disconnect();
    pannerLeftRef.current.disconnect();

    oscillatorRightRef.current.disconnect();
    gainNodeRightRef.current.disconnect();
    pannerRightRef.current.disconnect();

    // Close the audio context
    audioContextRef.current.close();

    // Stop WaveSurfer playback
    if (wavesurferRef.current) {
      wavesurferRef.current.pause();
    }

    setIsPlaying(false);
  };

  const startTimer = () => {
    if (isTimerRunning) return;

    setIsTimerRunning(true);
    timerRef.current = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);
  };

  const pauseTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      setIsTimerRunning(false);
    }
  };

  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setTimer(timerDuration * 60); // Set timer to the user-defined duration
    setIsTimerRunning(false);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const startTimerAndBeats = () => {
    startTimer();
    startBinauralBeats();
  };

  return (
    <div className="App">
      <h1>Binaural Beats for Focus</h1>
      <div className="timer">
        <h2>{formatTime(timer)}</h2>
        <div className="timer-buttons">
          <button onClick={startTimer} disabled={isTimerRunning}>Start Timer</button>
          <button onClick={pauseTimer} disabled={!isTimerRunning}>Pause Timer</button>
          <button onClick={resetTimer}>Reset Timer</button>
          <button onClick={startTimerAndBeats} disabled={isTimerRunning || isPlaying} className="start-all-btn">
            Start Timer and Beats
          </button>
        </div>
        <div className="control">
          <label>Timer Duration (minutes):</label>
          <input
            type="number"
            value={timerDuration}
            onChange={(e) => {
              const newDuration = Number(e.target.value);
              setTimerDuration(newDuration);
              setTimer(newDuration * 60);
            }}
            min="1"
            max="120"
          />
        </div>
      </div>
      <div className="controls">
        <div className="control">
          <label>Base Frequency (Hz):</label>
          <input
            type="number"
            value={baseFrequency}
            onChange={(e) => setBaseFrequency(Number(e.target.value))}
            min="100"
            max="1000"
          />
        </div>
        <div className="control">
          <label>Beat Frequency (Hz):</label>
          <input
            type="number"
            value={beatFrequency}
            onChange={(e) => setBeatFrequency(Number(e.target.value))}
            min="1"
            max="30"
          />
        </div>
        <div className="buttons">
          <button onClick={startBinauralBeats} disabled={isPlaying} className="btn start-btn">
            Start Beats
          </button>
          <button onClick={stopBinauralBeats} disabled={!isPlaying} className="btn stop-btn">
            Stop Beats
          </button>
        </div>
      </div>
      <div className="audio-upload">
        <input type="file" accept="audio/*" onChange={handleFileUpload} />
      </div>
      {audioFile && (
        <div>
          <div ref={waveformRef} className="waveform"></div>
          <div className="audio-controls">
            <button onClick={() => wavesurferRef.current.playPause()}>
              Play/Pause Audio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
