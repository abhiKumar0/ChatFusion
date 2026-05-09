import redis from '@/lib/redis';

export class PresenceService {
  static async setOnline(userId: string) {
    await redis.set(`user:online:${userId}`, '1', { ex: 60 });
  }

  static async setOffline(userId: string) {
    await redis.del(`user:online:${userId}`);
  }

  static async getPresence(userIds: string[]): Promise<Record<string, boolean>> {
    if (!userIds.length) return {};
    const keys = userIds.map(id => `user:online:${id}`);
    const results = await redis.mget(...keys);
    const presence: Record<string, boolean> = {};
    userIds.forEach((id, index) => {
      presence[id] = results[index] !== null;
    });
    return presence;
  }
}