import React, { useEffect, useRef, useState } from 'react';
import { useI18n } from '../lib/i18n';
import { Camera, CameraOff, Sparkles, CheckCircle2, Sliders, Hand, Eye, ShieldAlert, Layers, Play, RefreshCw } from 'lucide-react';
import { ArchitecturalProject } from '../types';
import { CameraPermissionModal, CameraDeniedNotice } from './CameraPermissionModal';
import {
  getHandLandmarker,
  analyzeHandLandmarks,
  HAND_CONNECTIONS,
  ProcessedHandGesture,
  DetectedHand
} from '../lib/handTracking';
import { HandLandmarker } from '@mediapipe/tasks-vision';

interface HandTrackingStudioProps {
  project: ArchitecturalProject;
  onGestureTrigger?: (gesture: {
    type: 'point' | 'pinch' | 'swipe' | 'rotate' | 'twoHand';
    x: number;
    y: number;
    deltaX?: number;
    deltaY?: number;
    scaleDelta?: number;
  }) => void;
  onAddWallByHand?: (start: { x: number; y: number }, end: { x: number; y: number }) => void;
}

export const HandTrackingStudio: React.FC<HandTrackingStudioProps> = ({
  project,
  onGestureTrigger,
  onAddWallByHand
}) => {
  const { t } = useI18n();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  // Mode states: REAL CAMERA vs DEMO / EMULATION
  const [trackingMode, setTrackingMode] = useState<'inactive' | 'real_camera' | 'demo_emulation'>('inactive');
  const [modelLoading, setModelLoading] = useState<boolean>(false);
  const [modelReady, setModelReady] = useState<boolean>(false);
  const [showPermissionModal, setShowPermissionModal] = useState<boolean>(false);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);

  // Real-time tracking data
  const [detectedHands, setDetectedHands] = useState<DetectedHand[]>([]);
  const [gestureInfo, setGestureInfo] = useState<ProcessedHandGesture | null>(null);
  const [activeTool, setActiveTool] = useState<'draw_wall' | 'select' | 'scale_mesh' | 'rotate_3d'>('draw_wall');

  // Drawing state connected to design workspace
  const [liveDrawingPoints, setLiveDrawingPoints] = useState<Array<{ x: number; y: number }>>([]);
  const isIndexDrawingRef = useRef(false);
  const lastIndexPosRef = useRef<{ x: number; y: number } | null>(null);

  // Stop camera helper that cleans up tracks and releases device
  const stopCameraStream = () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setTrackingMode('inactive');
    setDetectedHands([]);
    setGestureInfo(null);
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Initialize MediaPipe model when user initiates Real Camera or when needed
  const loadMediaPipeModel = async (): Promise<HandLandmarker | null> => {
    if (handLandmarkerRef.current) return handLandmarkerRef.current;
    setModelLoading(true);
    try {
      const landmarker = await getHandLandmarker();
      handLandmarkerRef.current = landmarker;
      setModelReady(true);
      setModelLoading(false);
      return landmarker;
    } catch (err) {
      console.warn('Could not load MediaPipe HandLandmarker:', err);
      setModelLoading(false);
      return null;
    }
  };

  // User confirmed "Allow Camera" in permission modal
  const handleConfirmAllowCamera = async () => {
    setShowPermissionModal(false);
    setPermissionDenied(false);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API unavailable in this browser environment');
      }

      // Pre-load MediaPipe model in parallel with webcam stream
      const modelPromise = loadMediaPipeModel();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      await modelPromise;
      setTrackingMode('real_camera');
      startRealTimeHandTrackingLoop();
    } catch (err: any) {
      console.warn('Real camera access denied or failed:', err);
      setPermissionDenied(true);
      setTrackingMode('inactive');
    }
  };

  // REAL CAMERA MODE LOOP: Ingests video frames into MediaPipe HandLandmarker
  const startRealTimeHandTrackingLoop = () => {
    let lastVideoTime = -1;

    const processFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState >= 2) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const landmarker = handLandmarkerRef.current;
          if (landmarker && video.currentTime !== lastVideoTime) {
            lastVideoTime = video.currentTime;
            try {
              const startTimeMs = performance.now();
              const results = landmarker.detectForVideo(video, startTimeMs);

              const analyzed = analyzeHandLandmarks(results);
              setGestureInfo(analyzed);
              setDetectedHands(analyzed.hands);

              // Render detected hands on canvas
              if (analyzed.hands.length > 0) {
                renderRealHandLandmarks(ctx, canvas, analyzed.hands);
                dispatchWorkspaceHandAction(analyzed, canvas);
              }
            } catch (err) {
              console.warn('Frame detection error:', err);
            }
          }
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(processFrame);
    };

    animationFrameIdRef.current = requestAnimationFrame(processFrame);
  };

  // Render Real MediaPipe 21 Landmarks & Skeletal Connections
  const renderRealHandLandmarks = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    hands: DetectedHand[]
  ) => {
    hands.forEach((hand, handIdx) => {
      const isLeft = hand.handedness === 'Left';
      const lms = hand.landmarks;

      // Draw Connection Lines between 21 joints
      ctx.lineWidth = 3;
      ctx.strokeStyle = isLeft ? 'rgba(138, 122, 106, 0.85)' : 'rgba(84, 72, 60, 0.9)';

      HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
        const p1 = lms[startIdx];
        const p2 = lms[endIdx];

        // Video is mirrored horizontally (-scale-x-100) so flip X coordinates
        const x1 = (1 - p1.x) * canvas.width;
        const y1 = p1.y * canvas.height;
        const x2 = (1 - p2.x) * canvas.width;
        const y2 = p2.y * canvas.height;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });

      // Draw Keypoint Nodes
      lms.forEach((p, idx) => {
        const px = (1 - p.x) * canvas.width;
        const py = p.y * canvas.height;

        ctx.beginPath();
        const isTip = idx === 4 || idx === 8 || idx === 12 || idx === 16 || idx === 20;
        const isIndexTip = idx === 8;

        ctx.arc(px, py, isIndexTip ? 9 : isTip ? 6 : 4, 0, 2 * Math.PI);
        ctx.fillStyle = isIndexTip ? '#54483C' : isTip ? '#8A7A6A' : '#FAF7F2';
        ctx.fill();
        ctx.strokeStyle = '#3F3832';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Highlight Index Interaction Pointer
        if (isIndexTip) {
          ctx.beginPath();
          ctx.arc(px, py, 18, 0, 2 * Math.PI);
          ctx.strokeStyle = 'rgba(84, 72, 60, 0.5)';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });

      // Hand Label
      const wrist = lms[0];
      const wx = (1 - wrist.x) * canvas.width;
      const wy = wrist.y * canvas.height + 24;
      ctx.fillStyle = '#54483C';
      ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`${hand.handedness} Hand (${Math.round(hand.score * 100)}%)`, wx - 30, wy);
    });
  };

  // Connect Real Hand Landmarks to DEAL Architectural Workspace
  const dispatchWorkspaceHandAction = (analyzed: ProcessedHandGesture, canvas: HTMLCanvasElement) => {
    if (!analyzed.indexTip) return;

    // Mirrored screen coordinate of the index finger
    const screenX = (1 - analyzed.indexTip.x) * canvas.width;
    const screenY = analyzed.indexTip.y * canvas.height;

    // Trigger workspace actions based on gesture
    if (analyzed.activeGesture === 'Pinch') {
      if (onGestureTrigger) {
        onGestureTrigger({
          type: 'pinch',
          x: screenX,
          y: screenY,
          scaleDelta: 0.04
        });
      }
    } else if (analyzed.activeGesture === 'Two-Hand Zoom' && analyzed.twoHandDistance) {
      if (onGestureTrigger) {
        onGestureTrigger({
          type: 'twoHand',
          x: screenX,
          y: screenY,
          scaleDelta: (analyzed.twoHandDistance - 0.4) * 0.1
        });
      }
    } else if (analyzed.activeGesture === 'Point') {
      if (onGestureTrigger) {
        onGestureTrigger({
          type: 'point',
          x: screenX,
          y: screenY
        });
      }

      // Drawing wall with index finger
      if (activeTool === 'draw_wall') {
        if (!isIndexDrawingRef.current) {
          isIndexDrawingRef.current = true;
          lastIndexPosRef.current = { x: screenX, y: screenY };
          setLiveDrawingPoints([{ x: screenX, y: screenY }]);
        } else {
          setLiveDrawingPoints((prev) => [...prev.slice(-30), { x: screenX, y: screenY }]);
        }
      }
    } else {
      // Finger released
      if (isIndexDrawingRef.current && lastIndexPosRef.current && liveDrawingPoints.length > 5) {
        const start = lastIndexPosRef.current;
        const end = liveDrawingPoints[liveDrawingPoints.length - 1];
        if (onAddWallByHand) {
          onAddWallByHand(start, end);
        }
      }
      isIndexDrawingRef.current = false;
      lastIndexPosRef.current = null;
    }
  };

  // DEMO / EMULATION MODE LOOP (Clearly labeled testing fallback)
  useEffect(() => {
    if (trackingMode !== 'demo_emulation') return;

    let animId: number;
    let time = 0;

    const renderEmulation = () => {
      time += 0.04;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2 + Math.sin(time * 1.4) * 90;
      const centerY = canvas.height / 2 + Math.cos(time * 1.8) * 50;

      // Simulated 21 joint positions
      const pts: Array<{ x: number; y: number; id: number }> = [
        { x: centerX, y: centerY + 120, id: 0 },
        { x: centerX - 45, y: centerY + 80, id: 1 },
        { x: centerX - 70, y: centerY + 40, id: 2 },
        { x: centerX - 85, y: centerY, id: 3 },
        { x: centerX - 95, y: centerY - 30, id: 4 },
        { x: centerX - 30, y: centerY - 20, id: 5 },
        { x: centerX - 35, y: centerY - 65, id: 6 },
        { x: centerX - 38, y: centerY - 105, id: 7 },
        { x: centerX - 40, y: centerY - 140, id: 8 },
        { x: centerX, y: centerY - 25, id: 9 },
        { x: centerX, y: centerY - 75, id: 10 },
        { x: centerX, y: centerY - 118, id: 11 },
        { x: centerX, y: centerY - 150, id: 12 },
        { x: centerX + 28, y: centerY - 18, id: 13 },
        { x: centerX + 32, y: centerY - 65, id: 14 },
        { x: centerX + 35, y: centerY - 105, id: 15 },
        { x: centerX + 38, y: centerY - 135, id: 16 },
        { x: centerX + 55, y: centerY, id: 17 },
        { x: centerX + 65, y: centerY - 35, id: 18 },
        { x: centerX + 72, y: centerY - 70, id: 19 },
        { x: centerX + 78, y: centerY - 95, id: 20 }
      ];

      // Draw bones
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(138, 122, 106, 0.7)';
      HAND_CONNECTIONS.forEach(([i, j]) => {
        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[j].x, pts[j].y);
        ctx.stroke();
      });

      // Draw nodes
      pts.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.id === 8 ? 8 : 4.5, 0, Math.PI * 2);
        ctx.fillStyle = p.id === 8 ? '#54483C' : '#8A7A6A';
        ctx.fill();
        ctx.strokeStyle = '#FAF7F2';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      animId = requestAnimationFrame(renderEmulation);
    };

    animId = requestAnimationFrame(renderEmulation);
    return () => cancelAnimationFrame(animId);
  }, [trackingMode]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAF7F2] p-6 overflow-y-auto">
      {/* Two-step Deliberate Camera Permission Modal */}
      <CameraPermissionModal
        isOpen={showPermissionModal}
        featureName="Hand Tracking"
        explanation="DEAL needs access to your camera to detect your hand movements and convert them into design actions."
        onAllow={handleConfirmAllowCamera}
        onCancel={() => setShowPermissionModal(false)}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-[#D8CEC2] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {trackingMode === 'real_camera' && (
              <span className="px-2.5 py-0.5 bg-emerald-800 text-white rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                REAL CAMERA MODE (MediaPipe Vision)
              </span>
            )}
            {trackingMode === 'demo_emulation' && (
              <span className="px-2.5 py-0.5 bg-amber-800 text-white rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <span>○</span>
                DEMO / EMULATION MODE (Testing & Demo Fallback)
              </span>
            )}
            {trackingMode === 'inactive' && (
              <span className="px-2 py-0.5 bg-[#EFE6DA] text-[#756A60] rounded text-[10px] uppercase font-semibold">
                Camera Inactive
              </span>
            )}
          </div>

          <h1 className="font-serif-arch text-2xl font-bold text-[#3F3832]">
            {t('handTitle')}
          </h1>
          <p className="text-xs text-[#756A60]">
            {t('handSubtitle')} · Real-time 21 landmark spatial computer vision
          </p>
        </div>

        {/* Mode & Action Controls */}
        <div className="flex items-center gap-2">
          {trackingMode === 'real_camera' ? (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded text-xs font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
                <span>● Camera Active</span>
              </span>
              <button
                onClick={stopCameraStream}
                className="px-3.5 py-1.5 bg-[#EFE6DA] text-[#54483C] border border-[#D8CEC2] rounded text-xs font-medium hover:bg-[#D8CEC2] transition-colors flex items-center gap-1.5"
              >
                <CameraOff className="w-3.5 h-3.5" />
                <span>Stop Camera</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPermissionModal(true)}
                disabled={modelLoading}
                className="px-4 py-2 bg-[#54483C] text-[#FAF7F2] rounded text-xs font-semibold hover:bg-[#3F3832] transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                <span>{modelLoading ? 'Initializing Vision...' : 'Start Hand Tracking'}</span>
              </button>

              <button
                onClick={() => {
                  stopCameraStream();
                  setTrackingMode('demo_emulation');
                }}
                className={`px-3 py-2 rounded text-xs border transition-colors ${
                  trackingMode === 'demo_emulation'
                    ? 'bg-[#54483C] text-[#FAF7F2] border-[#54483C]'
                    : 'bg-[#EFE6DA] text-[#54483C] border-[#D8CEC2] hover:bg-[#D8CEC2]'
                }`}
              >
                Start Demo Emulation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Camera Denied Warning Banner */}
      {permissionDenied && (
        <div className="mt-4">
          <CameraDeniedNotice
            onTryAgain={() => setShowPermissionModal(true)}
            onContinueWithoutCamera={() => {
              setPermissionDenied(false);
              setTrackingMode('demo_emulation');
            }}
          />
        </div>
      )}

      {/* Main Dual Workspace: Viewport Left | Tools & Telemetry Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 flex-1 min-h-[520px]">
        {/* Left: Viewport (Video + 21 Landmark Canvas) */}
        <div className="lg:col-span-7 bg-[#EFE6DA] rounded border border-[#D8CEC2] p-4 flex flex-col relative overflow-hidden">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-semibold text-[#54483C] uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              {trackingMode === 'real_camera'
                ? 'REAL CAMERA MODE (21 Landmarks Live)'
                : trackingMode === 'demo_emulation'
                ? 'DEMO / EMULATION MODE (Testing Fallback)'
                : 'Optical Sensor Inactive'}
            </span>
            <span className="text-[11px] text-[#756A60]">
              {detectedHands.length > 0 ? `${detectedHands.length} Hand(s) Detected` : 'Awaiting Hand Presence'}
            </span>
          </div>

          <div className="relative flex-1 bg-[#2C241E] rounded overflow-hidden flex items-center justify-center min-h-[380px]">
            {/* Live Video (mirrored horizontally for intuitive interaction) */}
            <video
              ref={videoRef}
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 ${
                trackingMode === 'real_camera' ? 'opacity-90' : 'hidden'
              }`}
            />

            {/* Inactive Empty State */}
            {trackingMode === 'inactive' && (
              <div className="absolute inset-0 bg-[#352D26] flex flex-col items-center justify-center text-center p-6 text-[#D8CEC2]">
                <Hand className="w-14 h-14 mb-3 text-[#D9CBBE] opacity-60" />
                <span className="text-xs uppercase tracking-widest font-bold text-[#D8CEC2] mb-1">
                  Camera required for Real Tracking
                </span>
                <p className="text-sm font-medium text-[#FAF7F2] max-w-sm">
                  Detects Left & Right hands, 21 finger landmarks, and connects index movements directly to the design canvas.
                </p>
                <p className="text-xs text-[#8A7A6A] mt-2 mb-4">
                  Camera is not active.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowPermissionModal(true)}
                    className="px-5 py-2.5 bg-[#54483C] text-[#FAF7F2] rounded text-xs font-semibold hover:bg-[#3F3832] transition-colors flex items-center gap-2 shadow-md"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Activate Real Camera</span>
                  </button>
                  <button
                    onClick={() => setTrackingMode('demo_emulation')}
                    className="px-4 py-2.5 bg-[#FAF7F2] text-[#54483C] border border-[#D8CEC2] rounded text-xs font-medium hover:bg-[#EFE6DA]"
                  >
                    Launch Demo Emulation
                  </button>
                </div>
              </div>
            )}

            {/* Demo / Emulation Banner */}
            {trackingMode === 'demo_emulation' && (
              <div className="absolute top-3 inset-x-3 z-30 bg-amber-950/90 text-amber-200 border border-amber-800 px-3 py-1.5 rounded text-xs text-center font-medium shadow">
                DEMO / EMULATION MODE ACTIVE — Move cursor or touch to test simulated hand joints. Start Real Camera Mode above for live computer vision.
              </div>
            )}

            {/* 21 Keypoints Landmark Canvas Overlay */}
            {trackingMode !== 'inactive' && (
              <canvas
                ref={canvasRef}
                width={640}
                height={480}
                className="absolute inset-0 w-full h-full z-10 pointer-events-auto"
              />
            )}

            {/* Live Gesture Badge */}
            {trackingMode !== 'inactive' && gestureInfo && (
              <div className="absolute bottom-4 left-4 z-20 bg-[#FAF7F2]/95 backdrop-blur border border-[#D8CEC2] px-3.5 py-2 rounded text-xs text-[#3F3832] shadow flex items-center gap-3">
                <div>
                  <span className="text-[10px] text-[#756A60] uppercase tracking-wider block">Detected Gesture</span>
                  <span className="font-bold text-[#54483C] text-sm">{gestureInfo.activeGesture}</span>
                </div>
                <div className="border-l border-[#D8CEC2] pl-3">
                  <span className="text-[10px] text-[#756A60] uppercase tracking-wider block">Pinch Distance</span>
                  <span className="font-mono text-xs">{Math.round(gestureInfo.pinchDistance * 100)}%</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Architectural Tool Binding & Landmark Telemetry */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Tool Binding */}
          <div className="bg-[#FAF7F2] border border-[#D8CEC2] rounded p-5">
            <h3 className="text-xs font-semibold text-[#54483C] uppercase tracking-wider mb-3">
              Index Finger Tool Assignment
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setActiveTool('draw_wall')}
                className={`p-3 rounded border text-left transition-colors ${
                  activeTool === 'draw_wall'
                    ? 'bg-[#54483C] text-[#FAF7F2] border-[#54483C]'
                    : 'bg-[#EFE6DA] text-[#3F3832] border-[#D8CEC2]'
                }`}
              >
                <span className="font-semibold block">Draw Wall</span>
                <span className="text-[10px] opacity-80">Index finger point & drag</span>
              </button>

              <button
                onClick={() => setActiveTool('select')}
                className={`p-3 rounded border text-left transition-colors ${
                  activeTool === 'select'
                    ? 'bg-[#54483C] text-[#FAF7F2] border-[#54483C]'
                    : 'bg-[#EFE6DA] text-[#3F3832] border-[#D8CEC2]'
                }`}
              >
                <span className="font-semibold block">Select Object</span>
                <span className="text-[10px] opacity-80">Point & hold 1 sec</span>
              </button>

              <button
                onClick={() => setActiveTool('scale_mesh')}
                className={`p-3 rounded border text-left transition-colors ${
                  activeTool === 'scale_mesh'
                    ? 'bg-[#54483C] text-[#FAF7F2] border-[#54483C]'
                    : 'bg-[#EFE6DA] text-[#3F3832] border-[#D8CEC2]'
                }`}
              >
                <span className="font-semibold block">Pinch / Resize</span>
                <span className="text-[10px] opacity-80">Thumb + Index close</span>
              </button>

              <button
                onClick={() => setActiveTool('rotate_3d')}
                className={`p-3 rounded border text-left transition-colors ${
                  activeTool === 'rotate_3d'
                    ? 'bg-[#54483C] text-[#FAF7F2] border-[#54483C]'
                    : 'bg-[#EFE6DA] text-[#3F3832] border-[#D8CEC2]'
                }`}
              >
                <span className="font-semibold block">Spatial Orbit</span>
                <span className="text-[10px] opacity-80">Open palm sweep</span>
              </button>
            </div>
          </div>

          {/* Real-time Hand Detection Telemetry */}
          <div className="bg-[#FAF7F2] border border-[#D8CEC2] rounded p-5 flex-1 flex flex-col justify-between text-xs">
            <div>
              <h3 className="text-xs font-semibold text-[#54483C] uppercase tracking-wider mb-3">
                Detected Hands & 21 Landmarks Status
              </h3>

              {detectedHands.length > 0 ? (
                <div className="space-y-3">
                  {detectedHands.map((hand, idx) => (
                    <div key={idx} className="bg-[#EFE6DA] p-3 rounded border border-[#D8CEC2]">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-[#3F3832]">{hand.handedness} Hand</span>
                        <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-semibold">
                          Confidence: {Math.round(hand.score * 100)}%
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-[#756A60]">
                        <div>• Wrist (0): Tracked</div>
                        <div>• Thumb Tip (4): Tracked</div>
                        <div>• Index Tip (8): Active Point</div>
                        <div>• Middle Tip (12): Tracked</div>
                        <div>• Ring Tip (16): Tracked</div>
                        <div>• Pinky Tip (20): Tracked</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-[#EFE6DA] rounded border border-[#D8CEC2] text-center text-[#756A60]">
                  <p>No hand currently in optical sensor view.</p>
                  <p className="text-[10px] mt-1">Raise your hand in front of the camera to engage 21-joint tracking.</p>
                </div>
              )}
            </div>

            {/* Gesture Guide */}
            <div className="mt-4 pt-3 border-t border-[#D8CEC2] text-[11px] text-[#756A60] space-y-1">
              <p>• <strong>Point</strong>: Draw extruded 3D walls or select architectural elements.</p>
              <p>• <strong>Pinch</strong>: Scale and resize doors, windows, and furniture.</p>
              <p>• <strong>Two-Hand</strong>: Zoom 3D viewport by varying inter-hand distance.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
