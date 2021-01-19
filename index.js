'use strict'

var legacy = require('character-entities-legacy')
var invalid = require('character-reference-invalid')
var decimal = require('is-decimal')
var hexadecimal = require('is-hexadecimal')
var alphanumerical = require('is-alphanumerical')
var decodeEntity = require('./decode-entity')

module.exports = parseEntities

var own = {}.hasOwnProperty
var fromCharCode = String.fromCharCode

// Warning messages.
var messages = [
  undefined,
  /* 1: Non terminated (named) */
  'Named character references must be terminated by a semicolon',
  /* 2: Non terminated (numeric) */
  'Numeric character references must be terminated by a semicolon',
  /* 3: Empty (named) */
  'Named character references cannot be empty',
  /* 4: Empty (numeric) */
  'Numeric character references cannot be empty',
  /* 5: Unknown (named) */
  'Named character references must be known',
  /* 6: Disallowed (numeric) */
  'Numeric character references cannot be disallowed',
  /* 7: Prohibited (numeric) */
  'Numeric character references cannot be outside the permissible Unicode range'
]

// Parse entities.
// eslint-disable-next-line complexity
function parseEntities(value, options) {
  var settings = options || {}
  var additional =
    typeof settings.additional === 'string'
      ? settings.additional.charCodeAt(0)
      : settings.additional
  var index = 0
  var lines = -1
  var queue = ''
  var result = []
  var pos
  var indent
  var line
  var column
  var entityCharacters
  var namedEntity
  var terminated
  var characters
  var character
  var reference
  var following
  var reason
  var output
  var entity
  var begin
  var start
  var type
  var test
  var previous
  var next
  var diff
  var end

  if (settings.position) {
    if (settings.position.indent || settings.position.start) {
      indent = settings.position.indent
      pos = settings.position.start
    } else {
      pos = settings.position
    }
  }

  line = (pos && pos.line) || 1
  column = (pos && pos.column) || 1

  // Cache the current point.
  previous = now()

  // Ensure the algorithm walks over the first character (inclusive).
  index--

  while (++index <= value.length) {
    // If the previous character was a newline.
    if (character === 10 /* `\n` */) {
      column = (indent && indent[lines]) || 1
    }

    character = value.charCodeAt(index)

    if (character === 38 /* `&` */) {
      following = value.charCodeAt(index + 1)

      // The behavior depends on the identity of the next character.
      if (
        following === 9 /* `\t` */ ||
        following === 10 /* `\n` */ ||
        following === 12 /* `\f` */ ||
        following === 32 /* ` ` */ ||
        following === 38 /* `&` */ ||
        following === 60 /* `<` */ ||
        following !== following ||
        (additional && following === additional)
      ) {
        // Not a character reference.
        // No characters are consumed, and nothing is returned.
        // This is not an error, either.
        queue += fromCharCode(character)
        column++
        continue
      }

      start = index + 1
      begin = start
      end = start

      if (following === 35 /* `#` */) {
        // Numerical reference.
        end = ++begin

        // The behavior further depends on the next character.
        following = value.charCodeAt(end)

        if (following === 88 /* `X` */ || following === 120 /* `x` */) {
          // ASCII hexadecimal digits.
          type = 'hexadecimal'
          end = ++begin
        } else {
          // ASCII decimal digits.
          type = 'decimal'
        }
      } else {
        // Named entity.
        type = 'named'
      }

      entityCharacters = ''
      entity = ''
      characters = ''
      // Each type of character reference accepts different characters.
      // This test is used to detect whether a reference has ended (as the semicolon
      // is not strictly needed).
      test =
        type === 'named'
          ? alphanumerical
          : type === 'decimal'
          ? decimal
          : hexadecimal

      end--

      while (++end <= value.length) {
        following = value.charCodeAt(end)

        if (!test(following)) {
          break
        }

        characters += fromCharCode(following)

        // Check if we can match a legacy named reference.
        // If so, we cache that as the last viable named reference.
        // This ensures we do not need to walk backwards later.
        if (type === 'named' && own.call(legacy, characters)) {
          entityCharacters = characters
          entity = legacy[characters]
        }
      }

      terminated = value.charCodeAt(end) === 59 /* `;` */

      if (terminated) {
        end++

        namedEntity = type === 'named' ? decodeEntity(characters) : false

        if (namedEntity) {
          entityCharacters = characters
          entity = namedEntity
        }
      }

      diff = 1 + end - start

      if (!terminated && settings.nonTerminated === false) {
        // Empty.
      } else if (!characters) {
        // An empty (possible) reference is valid, unless it’s numeric (thus an
        // ampersand followed by an octothorp).
        if (type !== 'named') {
          warning(4 /* Empty (numeric) */, diff)
        }
      } else if (type === 'named') {
        // An ampersand followed by anything unknown, and not terminated, is
        // invalid.
        if (terminated && !entity) {
          warning(5 /* Unknown (named) */, 1)
        } else {
          // If theres something after an entity name which is not known, cap
          // the reference.
          if (entityCharacters !== characters) {
            end = begin + entityCharacters.length
            diff = 1 + end - begin
            terminated = false
          }

          // If the reference is not terminated, warn.
          if (!terminated) {
            reason = entityCharacters
              ? 1 /* Non terminated (named) */
              : 3 /* Empty (named) */

            if (settings.attribute) {
              following = value.charCodeAt(end)

              if (following === 61 /* `=` */) {
                warning(reason, diff)
                entity = null
              } else if (alphanumerical(following)) {
                entity = null
              } else {
                warning(reason, diff)
              }
            } else {
              warning(reason, diff)
            }
          }
        }

        reference = entity
      } else {
        if (!terminated) {
          // All non-terminated numeric references are not rendered, and emit a
          // warning.
          warning(2 /* Non terminated (numeric) */, diff)
        }

        // When terminated and numerical, parse as either hexadecimal or
        // decimal.
        reference = parseInt(characters, type === 'hexadecimal' ? 16 : 10)

        // Emit a warning when the parsed number is prohibited, and replace with
        // replacement character.
        if (prohibited(reference)) {
          warning(7 /* Prohibited (numeric) */, diff)
          reference = fromCharCode(65533 /* `�` */)
        } else if (reference in invalid) {
          // Emit a warning when the parsed number is disallowed, and replace by
          // an alternative.
          warning(6 /* Disallowed (numeric) */, diff)
          reference = invalid[reference]
        } else {
          // Parse the number.
          output = ''

          // Emit a warning when the parsed number should not be used.
          if (disallowed(reference)) {
            warning(6 /* Disallowed (numeric) */, diff)
          }

          // Serialize the number.
          if (reference > 0xffff) {
            reference -= 0x10000
            output += fromCharCode((reference >>> (10 & 0x3ff)) | 0xd800)
            reference = 0xdc00 | (reference & 0x3ff)
          }

          reference = output + fromCharCode(reference)
        }
      }

      // Found it!
      // First eat the queued characters as normal text, then eat a reference.
      if (reference) {
        flush()

        previous = now()
        index = end - 1
        column += end - start + 1
        result.push(reference)
        next = now()
        next.offset++

        if (settings.reference) {
          settings.reference.call(
            settings.referenceContext,
            reference,
            {start: previous, end: next},
            value.slice(start - 1, end)
          )
        }

        previous = next
      } else {
        // If we could not find a reference, queue the checked characters (as
        // normal characters), and move the pointer to their end.
        // This is possible because we can be certain neither newlines nor
        // ampersands are included.
        characters = value.slice(start - 1, end)
        queue += characters
        column += characters.length
        index = end - 1
      }
    } else {
      // Handle anything other than an ampersand, including newlines and EOF.
      if (character === 10 /* `\n` */) {
        line++
        lines++
        column = 0
      }

      if (character === character) {
        queue += fromCharCode(character)
        column++
      } else {
        flush()
      }
    }
  }

  // Return the reduced nodes.
  return result.join('')

  // Get current position.
  function now() {
    return {
      line: line,
      column: column,
      offset: index + ((pos && pos.offset) || 0)
    }
  }

  // Handle the warning.
  function warning(code, offset) {
    var position

    if (settings.warning) {
      position = now()
      position.column += offset
      position.offset += offset

      settings.warning.call(
        settings.warningContext,
        messages[code],
        position,
        code
      )
    }
  }

  // Flush `queue` (normal text).
  // Macro invoked before each reference and at the end of `value`.
  // Does nothing when `queue` is empty.
  function flush() {
    if (queue) {
      result.push(queue)

      if (settings.text) {
        settings.text.call(settings.textContext, queue, {
          start: previous,
          end: now()
        })
      }

      queue = ''
    }
  }
}

// Check if `character` is outside the permissible unicode range.
function prohibited(code) {
  return (code >= 0xd800 && code <= 0xdfff) || code > 0x10ffff
}

// Check if `character` is disallowed.
function disallowed(code) {
  return (
    (code >= 0x0001 && code <= 0x0008) ||
    code === 0x000b ||
    (code >= 0x000d && code <= 0x001f) ||
    (code >= 0x007f && code <= 0x009f) ||
    (code >= 0xfdd0 && code <= 0xfdef) ||
    (code & 0xffff) === 0xffff ||
    (code & 0xffff) === 0xfffe
  )
}
