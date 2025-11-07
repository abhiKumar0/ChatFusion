'use client';

import { useCallStore } from '@/store/useCallStore';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function GlobalCallIndicator() {
// normalize whatever shape the call store currently exposes
const callStore = useCallStore();
const callStatus: string | undefined =
    // try known/legacy keys, fall back to nested call object
    (callStore as any).callStatus ??
    (callStore as any).status ??
    (callStore as any).call?.status;
const callId: string | undefined =
    (callStore as any).callId ??
    (callStore as any).currentCallId ??
    (callStore as any).call?.id;
  const pathname = usePathname();

  // Show the pill IF a call is in progress AND we are NOT on the call page
  const showPill = callStatus === 'in-progress' && !pathname?.startsWith(`/call/`);

  if (!showPill) {
    return null;
  }

  return (
    <Link href={`/call/${callId}`}>
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '10px 20px',
        background: 'green',
        color: 'white',
        borderRadius: '20px',
        zIndex: 1000,
        cursor: 'pointer'
      }}>
        Tap to return to call
      </div>
    </Link>
  );
}