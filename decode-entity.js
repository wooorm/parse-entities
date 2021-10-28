import {characterEntities} from 'character-entities'

const own = {}.hasOwnProperty

/**
 * @param {string} value
 * @returns {string|false}
 */
export function decodeEntity(value) {
  return own.call(characterEntities, value) ? characterEntities[value] : false
}
