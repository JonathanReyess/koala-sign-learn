import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, StopCircle, CheckCircle, XCircle, Upload, Play, Loader, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface LearningCardProps {
  word: string;
  onNext: () => void;
}

type FeedbackState = "idle" | "correct" | "incorrect" | "processing";

interface VideoFile {
    blob: Blob;
    url: string;
}

// 1. Define the map associating display words to their numerical class IDs (as strings).
// *** IMPORTANT: Update these string values to match the 'label' output from your FastAPI server's reverse_label_map. ***
const WORD_TO_ID_MAP: { [key: string]: string } = {
    // Example IDs (MANDATORY TO UPDATE THESE):
    "3": "3", 
    "13": "13", 
    "38": "38",
    "7": "7",
    "62": "62",
    // Ensure all words used in index.tsx are mapped here.
};


export const LearningCard = ({ word, onNext }: LearningCardProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>("idle");
  const [videoFile, setVideoFile] = useState<VideoFile | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);


  // Resets the component state for a new attempt or word
  const resetState = () => {
    setFeedback("idle");
    setVideoFile(null);
    setIsRecording(false);
    
    if (videoRef.current) {
        videoRef.current.src = "";
        // Stop any currently active camera streams if present
        if (videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
        videoRef.current.srcObject = null;
    }
  }

  // Function to handle inference via the Local FastAPI API
  const runInference = async (videoBlob: Blob) => {
    setFeedback("processing");
    toast.info("Sending video for analysis to local server...");

    const normalizedWord = word.toLowerCase();
    const expectedClassLabel = WORD_TO_ID_MAP[normalizedWord];

    if (!expectedClassLabel) {
        setFeedback("incorrect");
        toast.error(`Error: Word "${word}" is not mapped to a class ID in the frontend.`);
        console.error(`Word not found in WORD_TO_ID_MAP: ${word}. Cannot perform comparison.`);
        return;
    }

    try {
      const fastapiApiUrl = "http://localhost:8000/predict";
      const formData = new FormData();
      formData.append('video', videoBlob, 'sign_video.webm');
      
      const response = await fetch(fastapiApiUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
          throw new Error(`Server connection successful, but request failed with status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
          throw new Error(result.error || "Prediction failed with an unknown error on the server.");
      }
      
      // The predicted label is the string representation of the class ID from your backend
      const predictedClassLabel = String(result.predicted_class); 
      
      // Updated Comparison Logic: Compare the expected class ID with the predicted class ID
      const isCorrect = predictedClassLabel === expectedClassLabel;


      if (isCorrect) {
        setFeedback("correct");
        toast.success(`Great job! That's correct!`);
      } else {
        setFeedback("incorrect");
        toast.error(`Incorrect. Model predicted class ID: "${predictedClassLabel}". Expected ID: "${expectedClassLabel}" (for '${word}').`);
      }

    } catch (error) {
      console.error("Local FastAPI Inference Error:", error);
      setFeedback("incorrect"); 
      if (error instanceof Error && error.message.includes("Failed to fetch")) {
           toast.error("Could not connect to FastAPI server. Ensure 'uvicorn app:app --reload' is running on port 8000.");
      } else {
           toast.error("An error occurred during model inference. Check console for details.");
      }
    }
  };
  
  // --- Video Handling Functions ---

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          resetState();
          const url = URL.createObjectURL(file);
          setVideoFile({ blob: file, url });
          runInference(file); 
      }
      if (fileInputRef.current) {
          fileInputRef.current.value = '';
      }
  };

  const startRecording = async () => {
    resetState();
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        
        setVideoFile({ blob, url });
        
        stream.getTracks().forEach(track => track.stop());
        if (videoRef.current) {
             videoRef.current.srcObject = null;
        }

        runInference(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info("Recording started. Sign the word now!");
    } catch (error) {
      toast.error("Could not access camera. Please ensure permissions are granted.");
      console.error(error);
      resetState();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // --- UI Action Handlers ---

  const handleNext = () => {
    resetState();
    onNext();
  };

  const handleRetry = () => {
    resetState();
  };

  const isPredicting = feedback === "processing";
  const isVideoReady = !!videoFile && !isRecording && !isPredicting;
  const isIdle = feedback === "idle" && !isRecording;
  
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gray-50">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardContent className="pt-8 space-y-6">
          
          {/* Word Display */}
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground uppercase tracking-wide">Sign this word</p>
            <h2 className="text-5xl font-extrabold text-blue-600">{word}</h2>
          </div>

          {/* Video Area */}
          <div className="relative aspect-video bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden shadow-inner">
            
            <video
                ref={videoRef}
                autoPlay={!videoFile?.url}
                muted
                playsInline
                controls={isVideoReady}
                src={videoFile?.url || undefined}
                className="w-full h-full object-cover"
            />
            
            {/* Placeholder when idle */}
            {isIdle && !isRecording && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50/70">
                <Camera className="h-16 w-16 text-gray-400" />
              </div>
            )}

            {/* Recording Indicator */}
            {isRecording && (
                <div className="absolute top-4 left-4 flex items-center px-3 py-1 bg-red-600 rounded-full shadow-lg">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <span className="ml-2 text-sm font-semibold text-white">Recording...</span>
                </div>
            )}

            {/* Processing/Loading Overlay */}
            {isPredicting && (
              <div className="absolute inset-0 bg-gray-800/90 flex flex-col items-center justify-center animate-pulse">
                <Loader className="h-10 w-10 text-white animate-spin mb-3" />
                <p className="text-white text-xl font-semibold">Analyzing Sign...</p>
              </div>
            )}

            {/* Feedback Overlay - Correct */}
            {feedback === "correct" && (
              <div className="absolute inset-0 bg-green-500/90 flex items-center justify-center animate-in fade-in duration-500">
                <CheckCircle className="h-24 w-24 text-white" />
              </div>
            )}
            
            {/* Feedback Overlay - Incorrect */}
            {feedback === "incorrect" && (
              <div className="absolute inset-0 bg-red-500/90 flex items-center justify-center animate-in fade-in duration-500">
                <XCircle className="h-24 w-24 text-white" />
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Input Options (Upload/Record) */}
            {(isIdle || feedback === "incorrect") && (
                <div className="flex gap-4">
                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isPredicting}
                        className="flex-1 text-lg py-6 bg-blue-500 hover:bg-blue-600 transition"
                    >
                        <Upload className="mr-2 h-5 w-5" />
                        Upload Video
                    </Button>
                    <Button
                        onClick={startRecording}
                        disabled={isPredicting}
                        className="flex-1 text-lg py-6 bg-green-500 hover:bg-green-600 transition"
                    >
                        <Camera className="mr-2 h-5 w-5" />
                        Start Recording
                    </Button>
                </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              className="hidden"
            />

            {/* Action Buttons (Stop, Next, Try Again) */}
            <div className="flex justify-center">
                {/* Stop Recording Button (Only visible when recording) */}
                {isRecording && (
                  <Button
                    size="lg"
                    onClick={stopRecording}
                    variant="destructive"
                    className="text-lg px-8 py-6 shadow-xl"
                  >
                    <StopCircle className="mr-2 h-5 w-5" />
                    Stop Recording
                  </Button>
                )}

                {/* Next Word Button (Only visible when correct) */}
                {feedback === "correct" && (
                  <Button
                    size="lg"
                    onClick={handleNext}
                    className="text-lg px-8 py-6 bg-green-600 hover:bg-green-700 shadow-xl"
                  >
                    Next Word
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                )}

                {/* Try Again Button (Only visible when incorrect) */}
                {feedback === "incorrect" && (
                  <Button
                    size="lg"
                    onClick={handleRetry}
                    variant="outline"
                    className="text-lg px-8 py-6 border-red-500 text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="mr-2 h-5 w-5" />
                    Try Again
                  </Button>
                )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
