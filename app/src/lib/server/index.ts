import { env } from '$env/dynamic/private';
import { getRepository } from './repository';

/** The repository for this server, configured from .env (see .env.example). */
export const repo = () => getRepository(env);
