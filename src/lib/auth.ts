import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma'; // Assuming your Prisma client is here

// Define a type for the decoded JWT payload for type safety
interface UserPayload {
  userId: string;
  // You could include other fields like email, roles, etc.
}

/**
 * A server-side helper function to get the currently authenticated user.
 * It reads a JWT from the request cookies, verifies it, and fetches
 * the user from the database.
 * @returns {Promise<User | null>} The user object or null if not authenticated.
 */
export async function getCurrentUser() {
  try {
    // 1. Get the token from the request's 'token' cookie.
    const token = (await cookies()).get('token')?.value;

    if (!token) {
      // If there's no token, there's no logged-in user.
      return null;
    }

    // 2. Verify the token using the secret key stored in your environment variables.
    // This will throw an error if the token is invalid, expired, or tampered with.
    const decodedPayload = jwt.verify(token, process.env.JWT_SECRET!) as UserPayload;

    if (!decodedPayload?.userId) {
      // The token is malformed or doesn't contain the necessary info.
      return null;
    }

    // 3. Use the `userId` from the token to find the user in your database.
    // This confirms the user still exists.
    const user = await prisma.user.findUnique({
      where: { id: decodedPayload.userId },
      // Select only the fields you need for security and performance.
      // Never return the hashed password.
      select: {
        id: true,
        email: true,
        fullName: true,
      },
    });

    return user;

  } catch (error) {
    // This block will catch errors from jwt.verify if the token is invalid.
    console.error('Authentication error:', error);
    return null;
  }
}
