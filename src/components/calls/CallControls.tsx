import { useCallStore } from "@/store/useCallStore";
import { Mic, MicOff, Video, VideoOff, PhoneOff, ScreenShare, X as StopScreenShare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CallControlsProps {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare?: () => void;
  onEndCall: () => void;
}

export const CallControls = ({
  isAudioEnabled,
  isVideoEnabled,
  isScreenSharing,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onEndCall,
}: CallControlsProps) => {
  return (
    <div className="flex gap-4">
      <Button onClick={onToggleAudio} variant="outline" size="icon">
        {isAudioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
      </Button>
      <Button onClick={onToggleVideo} variant="outline" size="icon">
        {isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
      </Button>
      {onToggleScreenShare && (
        <Button onClick={onToggleScreenShare} variant="outline" size="icon">
          {isScreenSharing ? <StopScreenShare className="h-6 w-6" /> : <ScreenShare className="h-6 w-6" />}
        </Button>
      )}
      <Button onClick={onEndCall} variant="destructive" size="icon">
        <PhoneOff className="h-6 w-6" />
      </Button>
    </div>
  );
};
