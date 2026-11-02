import { Env } from '../../config/env.validation';

/** Same shape as the browser's RTCIceServer, so the client can pass it straight to RTCPeerConnection. */
export type IceServer = {
  urls: string | string[];
  username?: string;
  credential?: string;
};

// Google's public STUN servers are free and let two browsers discover how to reach each
// other. Users behind very strict NATs also need a TURN relay; that is only included when
// one is configured (e.g. a self-hosted coturn, which is free to run).
const FREE_STUN: IceServer = {
  urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'],
};

export function iceServers(
  env: Pick<Env, 'TURN_URL' | 'TURN_USERNAME' | 'TURN_CREDENTIAL'>,
): IceServer[] {
  if (!env.TURN_URL) return [FREE_STUN];
  return [
    FREE_STUN,
    {
      urls: env.TURN_URL,
      username: env.TURN_USERNAME,
      credential: env.TURN_CREDENTIAL,
    },
  ];
}
