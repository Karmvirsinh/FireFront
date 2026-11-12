import {seedStream} from './seed.js';
export const WOODLAND_CHARACTERS=['broadleaf','conifer','mixed','autumn'];
export function woodlandCharacter(seed){return WOODLAND_CHARACTERS[Math.floor(seedStream(seed,'woodland-character-v1')()*WOODLAND_CHARACTERS.length)];}
