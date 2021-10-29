import {characterEntities} from 'character-entities'

const own = {}.hasOwnProperty

/**
 * @param {string} value
 * @returns {string|false}
 */
export function decodeEntity(value) {
  // @ts-expect-error: to do: use `Record` for `character-entities`.
  return own.call(characterEntities, value) ? characterEntities[value] : false
}
