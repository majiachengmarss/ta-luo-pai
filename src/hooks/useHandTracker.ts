import { useEffect, useRef, useState } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export interface HandData {
  landmarks: any[];
  handedness: any[];
}

export const useHandTracker = (videoElement: HTMLVideoElement | null) => {
  const [handLandmarker, setHandLandmarker] = useState<HandLandmarker | null>(null);
  const [handData, setHandData] = useState<HandData | null>(null);
  const [status, setStatus] = useState<'initializing' | 'ready' | 'error' | 'no-hand'>('initializing');
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    const initTracker = async () => {
      try {
        console.log("Loading MediaPipe from local cache...");
        const vision = await FilesetResolver.forVisionTasks(
          "/mediapipe/wasm"
        );
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "/mediapipe/hand_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        setHandLandmarker(landmarker);
        setStatus('ready');
        console.log("MediaPipe Ready!");
      } catch (error) {
        console.error("MediaPipe Init Error:", error);
        setStatus('error');
      }
    };

    initTracker();
  }, []);

  const predict = () => {
    if (handLandmarker && videoElement && videoElement.readyState >= 2) {
      try {
        const startTimeMs = performance.now();
        const results = handLandmarker.detectForVideo(videoElement, startTimeMs);
        
        if (results.landmarks && results.landmarks.length > 0) {
          setHandData({
            landmarks: results.landmarks,
            handedness: results.handedness
          });
          setStatus('ready');
        } else {
          setHandData(null);
          setStatus('no-hand');
        }
      } catch (e) {
        console.error("Detection error:", e);
      }
    }
    requestRef.current = requestAnimationFrame(predict);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(predict);
    return () => {
      if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
    };
  }, [handLandmarker, videoElement]);

  return { handData, status };
};
