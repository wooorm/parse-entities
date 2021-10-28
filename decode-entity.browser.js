/* eslint-env browser */

const semicolon = 59 // `;`
const element = document.createElement('i')

/**
 * @param {string} value
 * @returns {string|false}
 */
export function decodeEntity(value) {
  const entity = '&' + value + ';'
  element.innerHTML = entity
  const char = element.textContent

  // Some entities do not require the closing semicolon (`&not` - for instance),
  // which leads to situations where parsing the assumed entity of `&notit;`
  // will result in the string `¬it;`.
  // When we encounter a trailing semicolon after parsing and the entity to
  // decode was not a semicolon (`&semi;`), we can assume that the matching was
  // incomplete
  if (char.charCodeAt(char.length - 1) === semicolon && value !== 'semi') {
    return false
  }

  // If the decoded string is equal to the input, the entity was not valid
  return char === entity ? false : char
}
