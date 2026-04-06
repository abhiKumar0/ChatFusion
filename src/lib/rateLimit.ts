import redis from "./redis";

export async function rateLimit(
    userId: string,
    limit:number = 10,
    windowSeconds : number = 60
) : Promise<{success: boolean, remaining: number}> {
    
    const key = `rate:${userId}:message`;

    const current = await redis.incr(key);

    if (current == 1) {
        await redis.expire(key, windowSeconds);
    }

    if (current > limit) {
        return {success: false, remaining: 0};
    }

    return {success: true, remaining: limit - current};
}