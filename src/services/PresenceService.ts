import redis from '@/lib/redis';

export class PresenceService {

  //Sets the user's status to online
  static async setOnline(userId: string) {
    await redis.set(`user:online:${userId}`, '1', { ex: 60 });
  }

  //Sets the user's status to offline
  static async setOffline(userId: string) {
    await redis.del(`user:online:${userId}`);
  }



  static async getPresence(userIds: string[]): Promise<Record<string, boolean>> {
    if (!userIds.length) return {};

    //Maps the ids with redis keys
    const keys = userIds.map(id => `user:online:${id}`);

    // Gets the presence of all the users using keys
    const results = await redis.mget(...keys);

    //Maps the results to the user ids
    const presence: Record<string, boolean> = {};
    userIds.forEach((id, index) => {
      presence[id] = results[index] !== null;
    });
    return presence;
  }
}