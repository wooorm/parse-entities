import {characterEntities} from 'character-entities'

var own = {}.hasOwnProperty

export function decodeEntity(characters) {
  return own.call(characterEntities, characters)
    ? characterEntities[characters]
    : false
}
