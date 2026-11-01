// Curriculum: 6 phases, 30 projects, resources. Dates are computed from the start date in your progress file.
export const CURRICULUM = {
 "phases": [
  {
   "id": 1,
   "name": "Reconnection",
   "goal": "Re-anchor in circuit theory, set up home lab, instrument fluency, MOSFET/analog/digital refresh, FPGA intro, ham radio licence.",
   "weeks": 15,
   "code": "U1",
   "chip": "REC-01",
   "color": "#39ff9f",
   "title": "Chapter 1 · The Bench Wakes Up",
   "story": "Twenty years ago the last thing you programmed was an 8051 in Keil A51 assembly. Arduino was just being born. Tonight the bench lights up again: a scope, a meter, a soldering iron, and a decision. This chapter is about reconnecting the wires in your head, from Ohm's law to the MOSFET to a Verilog counter blinking on an FPGA.",
   "blocks": [
    {
     "from": 1,
     "to": 2,
     "topic": "Lab setup and instrument mastery",
     "details": "Set up oscilloscope, multimeter, bench PSU, soldering station. Learn Rigol DS1054Z. Install LTspice and Falstad. Read AoE Ch 1.",
     "scene": "scope",
     "episode": "Power-on self test. Every instrument on the bench gets introduced to you, and you to it."
    },
    {
     "from": 3,
     "to": 5,
     "topic": "Circuit theory refresh",
     "details": "KVL/KCL, Thevenin/Norton, RC/RL/RLC transient response, phasors, impedance, resonance. MIT 6.002 Lectures 1-12. Hayt Ch 1-8. Simulate in LTspice.",
     "scene": "rc",
     "episode": "The laws haven't changed in 20 years. Kirchhoff is still right; LTspice just lets you prove it faster."
    },
    {
     "from": 6,
     "to": 8,
     "topic": "Semiconductor physics (modernised)",
     "details": "Diodes, BJTs, MOSFETs, CMOS. GaN, SiC, FinFET concepts. Load line analysis, small-signal models. MIT 6.012. Sedra/Smith Ch 1-5. Razavi YouTube.",
     "scene": "iv",
     "episode": "Vacuum tubes are gone from the syllabus. The MOSFET rules the world now, with GaN and SiC at the edges."
    },
    {
     "from": 9,
     "to": 11,
     "topic": "Analog circuits",
     "details": "Op-amps, INA128/AD8221, active filters (Sallen-Key, MFB), oscillators, linear regulators, intro to SMPS. AoE Ch 4-6. MIT 6.002 Lectures 13-24.",
     "scene": "bode",
     "episode": "Op-amps, filters and oscillators. The analog heart that every sensor in Chapter 5 will depend on."
    },
    {
     "from": 12,
     "to": 15,
     "topic": "Digital refresh + FPGA intro",
     "details": "Boolean algebra, combinational/sequential logic, state machines, Verilog basics on Artix-7. Ben Eater 8-bit computer series. MIT 6.004. Ham radio NIAR exam.",
     "scene": "logic",
     "episode": "From 8051 to FPGA. Logic you can now reshape in Verilog, and a ham radio exam on the side."
    }
   ]
  },
  {
   "id": 2,
   "name": "Embedded Systems",
   "goal": "Arduino through ESP32 to STM32 bare-metal ARM. PCB design in KiCad with first board ordered. Embedded DSP. FreeRTOS.",
   "weeks": 17,
   "code": "U2",
   "chip": "EMB-02",
   "color": "#2ee6ff",
   "title": "Chapter 2 · Silicon That Listens",
   "story": "The circuits you rebuilt now need a brain. You walk from Arduino to ESP32 to the bare metal of an STM32, writing registers by hand the way you once wrote 8051 opcodes. By the end, your own PCB arrives from the fab and a spectrum analyser you designed is dancing to music.",
   "blocks": [
    {
     "from": 1,
     "to": 3,
     "topic": "Arduino re-entry (modernised)",
     "details": "PlatformIO on VSCode. UART, I2C, SPI, ADC, PWM, timers, interrupts. Read sensor datasheets: MPU6050, SHT31, INA219.",
     "scene": "pwm",
     "episode": "Arduino again, but done properly: PlatformIO, datasheets and every peripheral by hand."
    },
    {
     "from": 4,
     "to": 6,
     "topic": "ESP32 WiFi/BLE + FreeRTOS",
     "details": "ESP-IDF framework. Dual-core Xtensa, WiFi, MQTT, BLE GATT. FreeRTOS: tasks, queues, semaphores, mutexes, event groups. IoT sensor dashboard.",
     "scene": "rtos",
     "episode": "Two cores, a radio and a real-time OS. Your sensors start talking to the internet."
    },
    {
     "from": 7,
     "to": 10,
     "topic": "STM32 bare-metal ARM",
     "details": "Register-level programming first. RCC, GPIO, USART, SPI, I2C, TIM, ADC from raw registers. OpenOCD + GDB via SWD. DMA pipeline. Phil's Lab series.",
     "scene": "registers",
     "episode": "No HAL, no safety net. Just you, the reference manual and raw register writes, like the old days."
    },
    {
     "from": 11,
     "to": 13,
     "topic": "PCB design with KiCad 8",
     "details": "Schematic → PCB → DRC → Gerbers → JLCPCB. Trace width, impedance, ground planes, decoupling caps, ESD. STM32F401 minimal system. Hand-solder QFP.",
     "scene": "pcb",
     "episode": "Your first real board. Schematic to Gerbers to a parcel from JLCPCB with your name on it."
    },
    {
     "from": 14,
     "to": 17,
     "topic": "Embedded DSP",
     "details": "CMSIS-DSP: FFT, FIR, IIR. Fixed-point vs float on Cortex-M. DMA-driven ADC pipeline. I2S audio codec. Real-time audio spectrum analyser.",
     "scene": "fft",
     "episode": "Maths running in real time on a microcontroller. Music turns into a spectrum on an OLED."
    }
   ]
  },
  {
   "id": 3,
   "name": "Signals & Communications",
   "goal": "DSP theory mastered through implementation. Communication systems updated through OFDM and 5G NR. GNU Radio and SDR fluency.",
   "weeks": 17,
   "code": "U3",
   "chip": "SIG-03",
   "color": "#ffb547",
   "title": "Chapter 3 · Catching Invisible Waves",
   "story": "The air around you is full of signals: aircraft, satellites, radio amateurs, Wi-Fi. With Fourier as your lens and an SDR as your ear, you learn to see them. A licensed call sign, an OFDM modem built from scratch, and a neural net that recognises modulation by eye.",
   "blocks": [
    {
     "from": 1,
     "to": 4,
     "topic": "DSP theory",
     "details": "CTFT, DTFT, DFT, FFT. Sampling theorem, Nyquist, aliasing. FIR/IIR filter design. Python: numpy.fft, scipy.signal. MIT 6.003, Stanford EE261.",
     "scene": "fourier",
     "episode": "Fourier is the lens. Every signal is just circles adding up."
    },
    {
     "from": 5,
     "to": 8,
     "topic": "DSP implementation on MCU",
     "details": "Port Python filters to C on STM32. CMSIS-DSP arm_fir_f32, arm_biquad. Polyphase decimation/interpolation. Real-time IIR equaliser. Q-format arithmetic.",
     "scene": "fir",
     "episode": "Python designs become C on a Cortex-M. Noise goes in, clean signal comes out."
    },
    {
     "from": 9,
     "to": 12,
     "topic": "Communication systems — updated",
     "details": "Review AM/FM/PM/PCM (20 min each). Deep dive OFDM, 5G NR numerology, massive MIMO, beamforming, polar codes, LDPC. Python BPSK/QPSK/QAM/OFDM modem with BER curves.",
     "scene": "constellation",
     "episode": "AM and FM in an afternoon, then OFDM and 5G: the modulation that runs the modern world."
    },
    {
     "from": 13,
     "to": 17,
     "topic": "Software-defined radio",
     "details": "GNU Radio, RTL-SDR V4: FM, ADS-B, NOAA satellites, ACARS. HackRF One: APRS, CW, SSB. APRS tracker build. AI signal classifier (CNN on RadioML 2018).",
     "scene": "waterfall",
     "episode": "An antenna on the window sill. Aircraft, weather satellites and your own call sign on air."
    }
   ]
  },
  {
   "id": 4,
   "name": "Robotics",
   "goal": "ROS2 Humble competency. Robot kinematics and control from first principles. Computer vision and SLAM. Full mobile manipulation system.",
   "weeks": 17,
   "code": "U4",
   "chip": "ROB-04",
   "color": "#ff5ea8",
   "title": "Chapter 4 · Giving It a Body",
   "story": "Electronics learns to move. ROS2 graphs, Jacobians and Lidar scans become an arm that reaches and a base that maps a room. Your filmmaker's eye records the moment a robot finds, grabs and delivers an object on its own.",
   "blocks": [
    {
     "from": 1,
     "to": 4,
     "topic": "ROS2 foundations",
     "details": "Ubuntu 22.04 LTS. ROS2 Humble: nodes, topics, services, actions, parameters, launch files. tf2, URDF. Rviz2, Gazebo Garden. Articulated Robotics (Josh Newans) series.",
     "scene": "rosgraph",
     "episode": "Nodes, topics and transforms. The nervous system of a robot."
    },
    {
     "from": 5,
     "to": 8,
     "topic": "Kinematics and control",
     "details": "D-H parameters, forward/inverse kinematics, Jacobian, workspace analysis. PID, state space, LQR, pole placement. MIT 18.06 Linear Algebra. Craig robotics book. Gazebo 2-DOF arm.",
     "scene": "arm",
     "episode": "Jacobians and joint angles. Teaching a two-link arm to reach exactly where you point."
    },
    {
     "from": 9,
     "to": 12,
     "topic": "Perception and computer vision",
     "details": "Camera calibration, OpenCV, SIFT/ORB, optical flow, stereo depth. YOLOv8, RealSense D435i. SLAM with cartographer-ros2. RPLidar A1.",
     "scene": "lidar",
     "episode": "Cameras, depth and Lidar. The robot learns to see the room it lives in."
    },
    {
     "from": 13,
     "to": 17,
     "topic": "Actuators and mobile manipulation",
     "details": "Dynamixel X-series, brushless DC + FOC, steppers. Motor sizing. Mobile manipulation robot: Nav2 + MoveIt2 full integration.",
     "scene": "motor",
     "episode": "Brushless motors, field-oriented control and a robot that navigates, sees and picks."
    }
   ]
  },
  {
   "id": 5,
   "name": "Biomechanics & Bioelectronics",
   "goal": "Biopotential signal acquisition from scratch. EMG gesture classification with ML. Prosthetic hand and exoskeleton design principles.",
   "weeks": 17,
   "code": "U5",
   "chip": "BIO-05",
   "color": "#b48cff",
   "title": "Chapter 5 · The Body Electric",
   "story": "Muscles speak in microvolts. You design the amplifiers that can hear them over 50 Hz hum, teach a classifier to read gestures from a forearm, and start shaping fingers that respond. Your years in human research finally meet your years in circuits.",
   "blocks": [
    {
     "from": 1,
     "to": 4,
     "topic": "Biomechanics fundamentals",
     "details": "Musculoskeletal anatomy, kinematics of human movement, kinetics, gait analysis. Force/torque for prosthetic joints. Winter textbook. OpenSim.",
     "scene": "gait",
     "episode": "The human body as a mechanism: joints, torques and the rhythm of walking."
    },
    {
     "from": 5,
     "to": 8,
     "topic": "Biopotential signal design",
     "details": "EMG: 20-500 Hz, 10 uV - 10 mV. INA128/AD8221, CMRR >80 dB. Electrode impedance. 50 Hz notch. Right-leg drive. ADS1299 AFE chip. Webster Ch 6-8.",
     "scene": "ecg",
     "episode": "Microvolt signals buried under mains hum. Instrumentation amps and right-leg drive pull them out."
    },
    {
     "from": 9,
     "to": 12,
     "topic": "EMG acquisition and ML classification",
     "details": "Custom EMG PCB in KiCad. Feature extraction: RMS, MAV, WL, ZC. scikit-learn SVM + 1D CNN in PyTorch. Real-time on STM32H7 (TFLite Micro). OpenBCI Cyton.",
     "scene": "emg",
     "episode": "Reading intent from muscle. Features, classifiers and real-time inference on an STM32H7."
    },
    {
     "from": 13,
     "to": 17,
     "topic": "Prosthetics and exoskeleton design",
     "details": "Underactuated finger designs, tendon routing. Dynamixel XL430. FSR + vibrotactile feedback. Exoskeleton joint torque. ISO 10993, IEC 60601. 3D print prosthetic hand.",
     "scene": "hand",
     "episode": "Tendons, fingers and feedback. Design a hand that a person could actually wear."
    }
   ]
  },
  {
   "id": 6,
   "name": "AI Integration & Capstone",
   "goal": "TinyML on MCUs. AI for communications. Full capstone: biomechanical prosthetic hand. IEEE conference paper. Portfolio documentation.",
   "weeks": 19,
   "code": "U6",
   "chip": "CAP-06",
   "color": "#ffe066",
   "title": "Chapter 6 · The Hand That Thinks",
   "story": "Everything converges. TinyML on a microcontroller, AI that watches the spectrum, and a prosthetic hand driven by your own EMG front-end. The final level is telling the story to the world: an IEEE paper, 30 documented projects and a film only you could make.",
   "blocks": [
    {
     "from": 1,
     "to": 4,
     "topic": "TinyML and edge AI",
     "details": "TFLite Micro: Keras → TFLite → int8. Quantisation, pruning, knowledge distillation. Edge Impulse. Deploy IMU gesture recogniser on Nano 33 BLE Sense. Warden TinyML book.",
     "scene": "neural",
     "episode": "Neural nets small enough to live on a microcontroller, running on a battery."
    },
    {
     "from": 5,
     "to": 8,
     "topic": "AI for communications",
     "details": "Spectrum sensing with CNN/LSTM on IQ data. RadioML 2018. Autoencoder anomaly detection. Cognitive radio, RL for channel selection. MIT 6.036.",
     "scene": "anomaly",
     "episode": "AI listens to the spectrum and flags what doesn't belong."
    },
    {
     "from": 9,
     "to": 14,
     "topic": "Capstone build",
     "details": "Full system: ADS1299 EMG PCB + STM32H7 DSP + TFLite Micro + 5-DOF Dynamixel hand + FSR feedback + nRF24L01 wireless + RPi5 + ROS2. >92% accuracy, <150 ms latency.",
     "scene": "capstone",
     "episode": "The capstone. EMG front-end, DSP, TinyML and a five-finger hand working as one system."
    },
    {
     "from": 15,
     "to": 19,
     "topic": "Documentation and publication",
     "details": "IEEE EMBC or ICRA paper (8 pages, LaTeX). Document all 30 projects on GitHub. Film 5-min capstone demo. Studio Aghora product viability assessment.",
     "scene": "broadcast",
     "episode": "Tell the story: paper, portfolio and a film. The bench becomes a body of work."
    }
   ]
  }
 ],
 "projects": [
  {
   "id": 1,
   "phase": 1,
   "title": "Bench measurement fundamentals",
   "description": "Characterise resistors, caps, and inductors across frequency with oscilloscope and multimeter.",
   "difficulty": "Beginner"
  },
  {
   "id": 2,
   "phase": 1,
   "title": "RLC bandpass filter — design → sim → build → measure",
   "description": "Design, simulate in LTspice, build on breadboard, measure with oscilloscope, compare to theory.",
   "difficulty": "Beginner"
  },
  {
   "id": 3,
   "phase": 1,
   "title": "BJT class-A common-emitter amplifier",
   "description": "Measure gain, bandwidth, and clipping. Compare LTspice model to real build.",
   "difficulty": "Beginner"
  },
  {
   "id": 4,
   "phase": 1,
   "title": "4th-order active Butterworth lowpass filter",
   "description": "Verify -80 dB/dec rolloff. Sallen-Key topology.",
   "difficulty": "Intermediate"
  },
  {
   "id": 5,
   "phase": 1,
   "title": "Crystal oscillator at 10 MHz with output buffer",
   "description": "Pierce crystal oscillator, measure frequency accuracy and spectral purity.",
   "difficulty": "Intermediate"
  },
  {
   "id": 6,
   "phase": 1,
   "title": "FPGA Verilog BCD counter with 7-segment display",
   "description": "Xilinx Artix-7, Vivado toolchain.",
   "difficulty": "Intermediate"
  },
  {
   "id": 7,
   "phase": 2,
   "title": "I2C multi-sensor data logger to SD card",
   "description": "MPU6050 + SHT31 + BMP388 via I2C, log to SD card.",
   "difficulty": "Beginner"
  },
  {
   "id": 8,
   "phase": 2,
   "title": "ESP32 IoT dashboard with MQTT and Node-RED",
   "description": "ESP-IDF framework, MQTT broker on Raspberry Pi, Node-RED UI.",
   "difficulty": "Intermediate"
  },
  {
   "id": 9,
   "phase": 2,
   "title": "STM32 bare-metal UART driver (no HAL, register level)",
   "description": "Register-level programming, no HAL, no LL abstraction.",
   "difficulty": "Advanced"
  },
  {
   "id": 10,
   "phase": 2,
   "title": "DC motor PID controller with encoder feedback",
   "description": "On STM32 Nucleo F446RE, quadrature encoder input, PID loop.",
   "difficulty": "Intermediate"
  },
  {
   "id": 11,
   "phase": 2,
   "title": "First custom PCB in KiCad — STM32F401 minimal system",
   "description": "Schematic, layout, DRC, Gerber export, ordered from JLCPCB. Hand-solder QFP package.",
   "difficulty": "Advanced"
  },
  {
   "id": 12,
   "phase": 2,
   "title": "Real-time audio spectrum analyser on STM32H7",
   "description": "44.1 kHz, 1024-point FFT, OLED display, CMSIS-DSP.",
   "difficulty": "Advanced"
  },
  {
   "id": 13,
   "phase": 3,
   "title": "OFDM modem simulation in Python (BPSK/QPSK/QAM, BER curves)",
   "description": "Full OFDM modem with cyclic prefix, AWGN channel, BER vs SNR plots.",
   "difficulty": "Advanced"
  },
  {
   "id": 14,
   "phase": 3,
   "title": "Complete FM receiver in GNU Radio with RDS decoding",
   "description": "RTL-SDR V4, GNU Radio flowgraph, stereo audio + RDS station info.",
   "difficulty": "Intermediate"
  },
  {
   "id": 15,
   "phase": 3,
   "title": "APRS GPS tracker (on-air, ham licence required)",
   "description": "GPS (u-blox NEO-M8N) → ESP32 AFSK modem → VHF radio → aprs.fi",
   "difficulty": "Advanced"
  },
  {
   "id": 16,
   "phase": 3,
   "title": "ADS-B aircraft receiver and web map",
   "description": "RTL-SDR at 1090 MHz, dump1090, web map display.",
   "difficulty": "Beginner"
  },
  {
   "id": 17,
   "phase": 3,
   "title": "NOAA weather satellite image decoder",
   "description": "RTL-SDR receive NOAA-15/18/19 APT signal, decode to image.",
   "difficulty": "Intermediate"
  },
  {
   "id": 18,
   "phase": 3,
   "title": "AI modulation classifier — CNN on IQ data",
   "description": "RadioML 2018 dataset, CNN trained in PyTorch, deployed on Raspberry Pi.",
   "difficulty": "Advanced"
  },
  {
   "id": 19,
   "phase": 4,
   "title": "2-DOF robotic arm with inverse kinematics in ROS2",
   "description": "Gazebo simulation, MoveIt2, forward and inverse kinematics from scratch.",
   "difficulty": "Intermediate"
  },
  {
   "id": 20,
   "phase": 4,
   "title": "Autonomous mobile robot with Nav2",
   "description": "ROS2 Nav2 navigation stack, full autonomous navigation.",
   "difficulty": "Advanced"
  },
  {
   "id": 21,
   "phase": 4,
   "title": "Real-time SLAM room mapping with RPLidar",
   "description": "cartographer-ros2, RPLidar A1, live map visualisation in Rviz2.",
   "difficulty": "Intermediate"
  },
  {
   "id": 22,
   "phase": 4,
   "title": "Pick-and-place robot with YOLOv8 + RealSense",
   "description": "Intel RealSense D435i depth camera, YOLOv8 object detection, Jetson Nano.",
   "difficulty": "Advanced"
  },
  {
   "id": 23,
   "phase": 4,
   "title": "Mobile manipulation system (navigate + detect + pick)",
   "description": "Differential drive base + 2-DOF arm, full ROS2 Nav2 + MoveIt2 integration. Film 3-min demo.",
   "difficulty": "Advanced"
  },
  {
   "id": 24,
   "phase": 5,
   "title": "Custom EMG acquisition PCB (INA128-based, KiCad)",
   "description": "Instrumentation amp front-end, 50 Hz notch, 20-500 Hz bandpass, KiCad to JLCPCB.",
   "difficulty": "Advanced"
  },
  {
   "id": 25,
   "phase": 5,
   "title": "EMG-controlled servo — basic myoelectric prosthetic",
   "description": "MyoWare 2.0 to Arduino to servo. Basic proof-of-concept.",
   "difficulty": "Intermediate"
  },
  {
   "id": 26,
   "phase": 5,
   "title": "Multi-gesture EMG classifier (SVM + 1D CNN, real-time)",
   "description": "5 gestures x 50 reps, scikit-learn + PyTorch, real-time inference on STM32H7 via TFLite Micro. Target >90% accuracy.",
   "difficulty": "Advanced"
  },
  {
   "id": 27,
   "phase": 5,
   "title": "Plantar pressure mapping insole with BLE telemetry",
   "description": "16 FSR 406 sensors, BLE telemetry, pressure map visualisation.",
   "difficulty": "Advanced"
  },
  {
   "id": 28,
   "phase": 6,
   "title": "TinyML gesture recogniser on Arduino Nano 33 BLE Sense",
   "description": "Edge Impulse, IMU data, 6 gestures, >95% accuracy, <100 ms inference, battery powered.",
   "difficulty": "Advanced"
  },
  {
   "id": 29,
   "phase": 6,
   "title": "AI spectrum anomaly detector (SDR + autoencoder)",
   "description": "RTL-SDR + GNU Radio + PyTorch autoencoder, detect interference and illegal transmitters.",
   "difficulty": "Advanced"
  },
  {
   "id": 30,
   "phase": 6,
   "title": "CAPSTONE: Biomechanical prosthetic hand with wireless telemetry",
   "description": "ADS1299 EMG PCB, STM32H7 DSP + TFLite Micro, 5-DOF Dynamixel hand, FSR feedback, nRF24L01 wireless, ROS2 monitoring. 5-gesture accuracy >92%, latency <150 ms.",
   "difficulty": "Advanced"
  }
 ],
 "resources": [
  {
   "id": 1,
   "type": "book",
   "title": "The Art of Electronics, 3rd ed",
   "author": "Horowitz & Hill",
   "phase": 1,
   "notes": "Must-buy. Use throughout all 6 phases.",
   "url": ""
  },
  {
   "id": 2,
   "type": "book",
   "title": "Engineering Circuit Analysis, 9th ed",
   "author": "Hayt, Kemmerly & Durbin",
   "phase": 1,
   "notes": "Phase 1 circuit theory. Ch 1-8.",
   "url": ""
  },
  {
   "id": 3,
   "type": "book",
   "title": "Microelectronic Circuits, 8th ed",
   "author": "Sedra & Smith",
   "phase": 1,
   "notes": "Phase 1 semiconductors. Ch 1-5.",
   "url": ""
  },
  {
   "id": 4,
   "type": "book",
   "title": "ARRL Handbook (current year)",
   "author": "ARRL",
   "phase": 1,
   "notes": "Ham radio and RF bible. Use throughout.",
   "url": ""
  },
  {
   "id": 5,
   "type": "book",
   "title": "Making Embedded Systems",
   "author": "Elecia White",
   "phase": 2,
   "notes": "Read first before Phase 2 starts.",
   "url": ""
  },
  {
   "id": 6,
   "type": "book",
   "title": "Programming Embedded Systems in C and C++",
   "author": "Barr & Massa",
   "phase": 2,
   "notes": "Phase 2 companion.",
   "url": ""
  },
  {
   "id": 7,
   "type": "book",
   "title": "The Scientist and Engineer's Guide to DSP",
   "author": "Steven Smith",
   "phase": 3,
   "notes": "Free at dspguide.com. Read first for Phase 3.",
   "url": "http://www.dspguide.com"
  },
  {
   "id": 8,
   "type": "book",
   "title": "Digital Signal Processing, 4th ed",
   "author": "Proakis & Manolakis",
   "phase": 3,
   "notes": "Phase 3 DSP theory.",
   "url": ""
  },
  {
   "id": 9,
   "type": "book",
   "title": "Communication Systems, 4th ed",
   "author": "Simon Haykin",
   "phase": 3,
   "notes": "Phase 3 comms systems.",
   "url": ""
  },
  {
   "id": 10,
   "type": "book",
   "title": "Wireless Communications",
   "author": "Andrea Goldsmith",
   "phase": 3,
   "notes": "Free PDF from Stanford.",
   "url": ""
  },
  {
   "id": 11,
   "type": "book",
   "title": "Modern Robotics",
   "author": "Lynch & Park",
   "phase": 4,
   "notes": "Free PDF. Coursera companion course.",
   "url": ""
  },
  {
   "id": 12,
   "type": "book",
   "title": "Introduction to Robotics: Mechanics and Control, 3rd ed",
   "author": "John Craig",
   "phase": 4,
   "notes": "Phase 4 kinematics reference.",
   "url": ""
  },
  {
   "id": 13,
   "type": "book",
   "title": "Probabilistic Robotics",
   "author": "Thrun, Burgard & Fox",
   "phase": 4,
   "notes": "Free PDF. SLAM and state estimation.",
   "url": ""
  },
  {
   "id": 14,
   "type": "book",
   "title": "Medical Instrumentation: Application and Design, 4th ed",
   "author": "Webster",
   "phase": 5,
   "notes": "Phase 5 bioelectronics bible. Ch 6-8 for EMG.",
   "url": ""
  },
  {
   "id": 15,
   "type": "book",
   "title": "Biomechanics and Motor Control of Human Movement, 4th ed",
   "author": "Winter",
   "phase": 5,
   "notes": "Phase 5 biomechanics. Ch 1-6.",
   "url": ""
  },
  {
   "id": 16,
   "type": "book",
   "title": "TinyML",
   "author": "Warden & Situnayake",
   "phase": 6,
   "notes": "Phase 6 edge AI on MCUs.",
   "url": ""
  },
  {
   "id": 17,
   "type": "book",
   "title": "Hands-On Machine Learning, 3rd ed",
   "author": "Aurélien Géron",
   "phase": 6,
   "notes": "Phase 6 ML reference.",
   "url": ""
  },
  {
   "id": 18,
   "type": "course",
   "title": "MIT 6.002 Circuits and Electronics (OCW)",
   "author": "Agarwal",
   "phase": 1,
   "notes": "Start here. Lectures 1-24.",
   "url": "https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/"
  },
  {
   "id": 19,
   "type": "course",
   "title": "MIT 6.004 Computation Structures (OCW)",
   "author": "MIT",
   "phase": 1,
   "notes": "Phase 1 digital refresh.",
   "url": "https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/"
  },
  {
   "id": 20,
   "type": "course",
   "title": "Stanford EE261 The Fourier Transform and Its Applications",
   "author": "Brad Osgood",
   "phase": 3,
   "notes": "All 30 lectures on YouTube. Essential for Phase 3.",
   "url": "https://www.youtube.com/playlist?list=PLB24BC7956EE040CD"
  },
  {
   "id": 21,
   "type": "course",
   "title": "MIT 6.832 Underactuated Robotics",
   "author": "Tedrake",
   "phase": 4,
   "notes": "Free at underactuated.mit.edu.",
   "url": "https://underactuated.mit.edu"
  },
  {
   "id": 22,
   "type": "course",
   "title": "Coursera: Modern Robotics Specialisation",
   "author": "Northwestern / Lynch & Park",
   "phase": 4,
   "notes": "6-course specialisation.",
   "url": "https://www.coursera.org/specializations/modernrobotics"
  },
  {
   "id": 23,
   "type": "youtube",
   "title": "EEVblog (Dave Jones)",
   "author": "Dave Jones",
   "phase": 1,
   "notes": "Practical electronics, oscilloscope tutorials. Watch #372 first.",
   "url": "https://www.youtube.com/@EEVblog"
  },
  {
   "id": 24,
   "type": "youtube",
   "title": "Ben Eater 8-bit computer series",
   "author": "Ben Eater",
   "phase": 1,
   "notes": "All 44 videos. Mandatory for Phase 1 digital refresh.",
   "url": "https://www.youtube.com/playlist?list=PLowKtXNTBypGqImE405J2565dvjafglHU"
  },
  {
   "id": 25,
   "type": "youtube",
   "title": "Phil's Lab (STM32 bare-metal and embedded DSP)",
   "author": "Phil's Lab",
   "phase": 2,
   "notes": "Best STM32 channel on YouTube.",
   "url": "https://www.youtube.com/@PhilsLab"
  },
  {
   "id": 26,
   "type": "youtube",
   "title": "Articulated Robotics (Josh Newans)",
   "author": "Josh Newans",
   "phase": 4,
   "notes": "Best ROS2 series available. All episodes mandatory.",
   "url": "https://www.youtube.com/@ArticulatedRobotics"
  },
  {
   "id": 27,
   "type": "youtube",
   "title": "W2AEW (Alan Wolke)",
   "author": "W2AEW",
   "phase": 1,
   "notes": "RF and oscilloscope mastery.",
   "url": "https://www.youtube.com/@w2aew"
  }
 ]
};
