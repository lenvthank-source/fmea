import { ServiceUnavailableException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomInt } from 'node:crypto';

export const HANDLE_WORDS = ["table", "bear", "sugar", "cup", "paper", "ball", "apple", "atlas", "badge", "basket", "beach", "beam", "bell", "berry", "bird", "bloom", "boat", "book", "branch", "brick", "brook", "brush", "bucket", "cable", "candle", "canvas", "cedar", "chair", "cloud", "coast", "coral", "crane", "creek", "crown", "dawn", "desk", "dune", "earth", "ember", "feather", "field", "flame", "flower", "forest", "fox", "frame", "garden", "gate", "glass", "globe", "grain", "grape", "grove", "harbor", "hat", "hawk", "hill", "honey", "house", "ice", "island", "jar", "kite", "lake", "lamp", "leaf", "lemon", "light", "lime", "lion", "maple", "meadow", "metal", "mint", "moon", "moss", "mouse", "nest", "oak", "ocean", "olive", "orange", "otter", "owl", "palm", "panda", "peach", "pearl", "pebble", "pen", "pepper", "pine", "plant", "plate", "pond", "pool", "quartz", "quilt", "rabbit", "rain", "raven", "reed", "river", "robin", "rock", "rose", "sail", "sand", "seed", "shell", "sky", "snow", "soap", "soil", "sparrow", "spoon", "spring", "star", "stone", "storm", "stream", "sun", "swan", "tea", "tent", "thread", "tiger", "timber", "toast", "torch", "tower", "trail", "tree", "tulip", "turtle", "valley", "vine", "wave", "wheel", "willow", "wind", "wing", "wolf", "wood", "yarn", "zebra"] as const;
export const HANDLE_CAPACITY = HANDLE_WORDS.length ** 2;

/** Insert-on-conflict avoids aborting the surrounding PostgreSQL transaction. */
export async function reservePublicHandle(
  tx: Pick<Prisma.TransactionClient, 'publicHandleReservation'>,
  pick: (max: number) => number = randomInt,
): Promise<string> {
  const reserved = new Set((await tx.publicHandleReservation.findMany({ select: { handle: true } })).map(row => row.handle));
  // Random start followed by a complete traversal guarantees finite-pool exhaustion detection.
  const start = pick(HANDLE_CAPACITY);
  for (let offset = 0; offset < HANDLE_CAPACITY; offset++) {
    const index = (start + offset) % HANDLE_CAPACITY;
    const handle = `${HANDLE_WORDS[Math.floor(index / HANDLE_WORDS.length)]}-${HANDLE_WORDS[index % HANDLE_WORDS.length]}`;
    if (reserved.has(handle)) continue;
    const inserted = await tx.publicHandleReservation.createMany({ data: [{ handle }], skipDuplicates: true });
    if (inserted.count === 1) return handle;
  }
  throw new ServiceUnavailableException('Trial usernames are currently at capacity. Please contact support.');
}
