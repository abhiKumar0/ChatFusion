import { useCallStore } from "@/store/useCallStore";
import { Button } from "@/components/ui/button";

export const IncomingCall = () => {
  const { call, actions } = useCallStore();
  const { reset } = actions;

  const handleAccept = () => {
    // The answerCall logic is in CallManager
    // We just need to set the state to trigger it
    useCallStore.setState((state) => {
      state.call.isReceivingCall = false;
      state.call.isCallInProgress = true;
    });
  };

  const handleReject = () => {
    reset();
  };

  return (
    <div className="fixed top-4 right-4 bg-white p-4 rounded-lg shadow-lg z-50">
      <p>Incoming call from {call.caller?.name}</p>
      <div className="flex gap-4 mt-4">
        <Button onClick={handleAccept} variant="outline">
          Accept
        </Button>
        <Button onClick={handleReject} variant="destructive">
          Reject
        </Button>
      </div>
    </div>
  );
};
