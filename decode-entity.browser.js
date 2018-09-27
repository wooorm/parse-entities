/* eslint-env browser */
var el

module.exports = decodeEntity

function decodeEntity(characters) {
  el = el || document.createElement('em')
  var entity = '&' + characters + ';'
  el.innerHTML = entity
  var char = el.textContent

  // Some entities do not require the closing semicolon (&not - for instance),
  // which leads to situations where parsing the assumed entity of &notit; will
  // result in the string "¬it;". When we encounter a trailing semicolon after
  // parsing and the entity to decode was not a semicolon (&semi;), we can
  // assume that the matching was incomplete
  if (char.slice(-1) === ';' && characters !== 'semi') {
    return false
  }

  // If the decoded string is equal to the input, the entity was not valid
  return char === entity ? false : char
}
