import { prisma } from '@/lib/prisma';

export class CallService {
  static async initiateCall({
    callerId,
    receiverId,
    offerSdp,
    isVideo,
  }: {
    callerId: string;
    receiverId: string;
    offerSdp: string;
    isVideo: boolean;
  }) {
    const call = await prisma.call.create({
      data: {
        callerId,
        receiverId,
        status: 'PENDING',
        offerSdp,
        isVideo,
      },
      include: {
        caller: true,
        receiver: true,
      },
    });

    return call;
  }

  static async updateStatus(callId: string, status: 'ACCEPTED' | 'REJECTED' | 'ENDED') {
    return prisma.call.update({
      where: { id: callId },
      data: { status },
    });
  }

  static async answerCall(callId: string, answerSdp: string) {
    return prisma.call.update({
      where: { id: callId },
      data: { answerSdp, status: 'ACCEPTED' },
    });
  }
}