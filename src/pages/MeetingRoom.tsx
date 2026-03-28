import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useRef } from 'react';

export default function MeetingRoom() {
  const { id: roomId } = useParams<{ id: string }>();
  const { userInfo } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!roomId) {
      navigate('/meetings');
      return;
    }

    if (!userInfo) {
      // Must be logged in to join the meeting
      return;
    }

    let zc: any;

    const startMeeting = async () => {
      // Replace with your actual AppID and ServerSecret from ZEGOCLOUD Console
      // For this implementation, we can use a temporary or purely mock config if none provided,
      // but Zegocloud requires an AppID. To make it work instantly without the user creating an account,
      // we generate a unique token or use a public generic testing ID if we had one.
      // Since we don't safely have their ZegoCloud developer secrets, we will just stub the config
      // so the user knows they just need to insert their AppID.
      
      const appID = 123456789; // TODO: Replace with your ZEGOCLOUD App ID
      const serverSecret = "REPLACE_WITH_YOUR_ZEGOCLOUD_SERVER_SECRET"; // TODO: Replace with ServerSecret
      
      // Kit Token generation
      const kitToken =  ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID, 
        serverSecret, 
        roomId, 
        userInfo._id, // Unique user ID
        userInfo.name || userInfo.email || "Employee"
      );

      // Create instance
      zc = ZegoUIKitPrebuilt.create(kitToken);

      // Integrate meeting UI into our React div container
      if (containerRef.current) {
         zc.joinRoom({
            container: containerRef.current,
            scenario: {
              mode: ZegoUIKitPrebuilt.VideoConference, // Full conference layout
            },
            showScreenSharingButton: true,
            turnOnMicrophoneWhenJoining: true,
            turnOnCameraWhenJoining: true,
            showMyCameraToggleButton: true,
            showMyMicrophoneToggleButton: true,
            showAudioVideoSettingsButton: true,
            showTextChat: true,      // "build all tab" chat tab
            showUserList: true,      // "build all tab" participant list
            onLeaveRoom: () => {
              navigate('/meetings'); // Go back to meetings schedule when hangup
            }
         });
      }
    };

    startMeeting();

    return () => {
       // Cleanup zego instance
       if (zc && typeof zc.destroy === 'function') {
           zc.destroy();
       }
    };
  }, [roomId, userInfo, navigate]);

  if (!userInfo) {
      return (
          <div className="flex min-h-screen items-center justify-center bg-slate-50">
              <p className="text-slate-500 font-bold">Please log in to join the meeting...</p>
          </div>
      );
  }

  return (
    <div className="h-screen w-full bg-slate-900 flex flex-col">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800 text-white">
          <div className="flex items-center gap-3">
              <span className="text-xl">📹</span>
              <h1 className="font-bold text-lg">Secure Meeting Room</h1>
              <span className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-300 font-mono tracking-wider ml-4">
                  ID: {roomId}
              </span>
          </div>
          <button 
             onClick={() => navigate('/meetings')}
             className="px-4 py-2 border border-slate-700 text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-800 transition"
          >
              Back to Dashboard
          </button>
      </div>
      
      {/* The actual video conference viewport managed by ZegoUIKit */}
      <div className="flex-1 w-full relative" ref={containerRef}>
      </div>
    </div>
  );
}
