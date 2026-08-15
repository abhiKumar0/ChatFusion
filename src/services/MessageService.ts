import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

export class MessageService {
  static async sendMessage({
    conversationId,
    senderId,
    content,
    media,
    nonce,
    type,
    parentId,
  }: {
    conversationId: string;
    senderId: string;
    content: string;
    media?: string;
    nonce?: string;
    type: 'TEXT' | 'IMAGE';
    parentId?: string;
  }) {
    // Verify participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId, userId: senderId },
    });

    if (!participant) throw new Error('Not a participant');

    const message = await prisma.message.create({
      data: {
        senderId,
        content: content || '',
        media,
        conversationId,
        parentMessageId: parentId,
        nonce: nonce || randomBytes(12).toString('base64'),
        type,
        status: 'sent',
      },
      include: {
        sender: true,
        parentMessage: {
          include: { sender: true },
        },
      },
    });

    // Touch conversation so it bubbles to top of list
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {},
    });

    return message;
  }

  static async getMessages({
    conversationId,
    cursor,
    limit = 50,
  }: {
    conversationId: string;
    cursor?: string;
    limit?: number;
  }) {
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        ...(cursor && {
          createdAt: {
            lt: (await prisma.message.findUnique({ where: { id: cursor } }))?.createdAt,
          },
        }),
      },
      include: {
        sender: {
          select: { id: true, fullName: true, username: true, publicKey: true, email: true },
        },
        parentMessage: {
          include: {
            sender: { select: { id: true, fullName: true, username: true } },
          },
        },
        reactions: {
          include: {
            user: { select: { id: true, fullName: true, username: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return {
      messages,
      nextCursor: messages.length === limit ? messages[limit - 1].id : null,
    };
  }

  static async updateMessage({
    messageId,
    senderId,
    content,
    nonce
  }: {
    messageId: string;
    senderId: string;
    content: string;
    nonce: string;
  }) {

    // Check if message exist
    const message = await prisma.message.findFirst({
      where: { id: messageId, senderId},
    });

    if (!message) {
      throw new Error("Message not found or you are not the sender");
    }

    // Update the message
    const updatedMessage = await prisma.message.update({
      where: { id: messageId},
      data: {
        content,
        nonce,
        updatedAt: new Date()
      },
      include: {
        sender: true,
        parentMessage: {
          include: { sender: true },
        },
      },
    });

    return updatedMessage;
  }

  static async deleteMessage({ messageId, senderId }: { messageId: string; senderId: string }) {
    // Check if message exist
    const message = await prisma.message.findFirst({
      where: { id: messageId, senderId },
    });

    if (!message) throw new Error('Message not found or you are not the sender');

    // Delete message
    await prisma.message.delete({
      where: { id: messageId },
    });
  }
}