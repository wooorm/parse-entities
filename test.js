/**
 * @import {Point, Position} from 'unist'
 * @import {Options} from './index.js'
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import {parseEntities} from './index.js'

test('parseEntities(value)', function () {
  assert.equal(
    parseEntities('I’m &notit; though'),
    'I’m ¬it; though',
    'example #1 (without options)'
  )

  assert.equal(
    parseEntities('I’m &notin; though'),
    'I’m ∉ though',
    'example #2 (without options)'
  )

  assert.deepEqual(
    check('foo &amp; bar'),
    {
      result: 'foo & bar',
      reference: [['&', position(1, 5, 4, 1, 10, 9), '&amp;']],
      text: [
        ['foo ', position(1, 1, 0, 1, 5, 4)],
        [' bar', position(1, 10, 9, 1, 14, 13)]
      ],
      warning: []
    },
    'should work on a named reference'
  )

  assert.deepEqual(
    check('foo &#123; bar'),
    {
      result: 'foo { bar',
      reference: [['{', position(1, 5, 4, 1, 11, 10), '&#123;']],
      text: [
        ['foo ', position(1, 1, 0, 1, 5, 4)],
        [' bar', position(1, 11, 10, 1, 15, 14)]
      ],
      warning: []
    },
    'should work on a decimal reference'
  )

  assert.deepEqual(
    check('foo &#x123; bar'),
    {
      result: 'foo ģ bar',
      reference: [['ģ', position(1, 5, 4, 1, 12, 11), '&#x123;']],
      text: [
        ['foo ', position(1, 1, 0, 1, 5, 4)],
        [' bar', position(1, 12, 11, 1, 16, 15)]
      ],
      warning: []
    },
    'should work on a hexadecimal reference'
  )

  assert.deepEqual(
    check('&amp; bar'),
    {
      result: '& bar',
      reference: [['&', position(1, 1, 0, 1, 6, 5), '&amp;']],
      text: [[' bar', position(1, 6, 5, 1, 10, 9)]],
      warning: []
    },
    'should work when the reference is initial'
  )

  assert.deepEqual(
    check('foo &amp;'),
    {
      result: 'foo &',
      reference: [['&', position(1, 5, 4, 1, 10, 9), '&amp;']],
      text: [['foo ', position(1, 1, 0, 1, 5, 4)]],
      warning: []
    },
    'should work when the reference is final'
  )

  assert.deepEqual(
    check('&amp;&#123;&#x123;'),
    {
      result: '&{ģ',
      reference: [
        ['&', position(1, 1, 0, 1, 6, 5), '&amp;'],
        ['{', position(1, 6, 5, 1, 12, 11), '&#123;'],
        ['ģ', position(1, 12, 11, 1, 19, 18), '&#x123;']
      ],
      text: [],
      warning: []
    },
    'should work for adjacent entities'
  )

  assert.deepEqual(
    check('foo &amp bar'),
    {
      result: 'foo & bar',
      reference: [['&', position(1, 5, 4, 1, 9, 8), '&amp']],
      text: [
        ['foo ', position(1, 1, 0, 1, 5, 4)],
        [' bar', position(1, 9, 8, 1, 13, 12)]
      ],
      warning: [
        [
          'Named character references must be terminated by a semicolon',
          point(1, 9, 8),
          1
        ]
      ]
    },
    'should work when named but warn without terminal semicolon'
  )

  assert.deepEqual(
    check('foo &amp bar', {nonTerminated: false}),
    {
      result: 'foo &amp bar',
      reference: [],
      text: [['foo &amp bar', position(1, 1, 0, 1, 13, 12)]],
      warning: []
    },
    'should work if `nonTerminated` is given'
  )

  assert.deepEqual(
    check('foo &#123 bar'),
    {
      result: 'foo { bar',
      reference: [['{', position(1, 5, 4, 1, 10, 9), '&#123']],
      text: [
        ['foo ', position(1, 1, 0, 1, 5, 4)],
        [' bar', position(1, 10, 9, 1, 14, 13)]
      ],
      warning: [
        [
          'Numeric character references must be terminated by a semicolon',
          point(1, 10, 9),
          2
        ]
      ]
    },
    'should fail when numerical and without terminal semicolon'
  )

  assert.deepEqual(
    check('Foo &\tbar'),
    {
      result: 'Foo &\tbar',
      reference: [],
      text: [['Foo &\tbar', position(1, 1, 0, 1, 10, 9)]],
      warning: []
    },
    'should work on an ampersand followed by a tab'
  )

  assert.deepEqual(
    check('Foo &\nbar'),
    {
      result: 'Foo &\nbar',
      reference: [],
      text: [['Foo &\nbar', position(1, 1, 0, 2, 4, 9)]],
      warning: []
    },
    'should work on an ampersand followed by a newline'
  )

  assert.deepEqual(
    check('Foo &\fbar'),
    {
      result: 'Foo &\fbar',
      reference: [],
      text: [['Foo &\fbar', position(1, 1, 0, 1, 10, 9)]],
      warning: []
    },
    'should work on an ampersand followed by a form-feed'
  )

  assert.deepEqual(
    check('Foo & bar'),
    {
      result: 'Foo & bar',
      reference: [],
      text: [['Foo & bar', position(1, 1, 0, 1, 10, 9)]],
      warning: []
    },
    'should work on an ampersand followed by a space'
  )

  assert.deepEqual(
    check('Foo &<bar'),
    {
      result: 'Foo &<bar',
      reference: [],
      text: [['Foo &<bar', position(1, 1, 0, 1, 10, 9)]],
      warning: []
    },
    'should work on an ampersand followed by a `<`'
  )

  assert.deepEqual(
    check('Foo &&bar'),
    {
      result: 'Foo &&bar',
      reference: [],
      text: [['Foo &&bar', position(1, 1, 0, 1, 10, 9)]],
      // The warning here is for the following ampersand, followed by `bar`,
      // which is not a reference.
      warning: [
        ['Named character references cannot be empty', point(1, 7, 6), 3]
      ]
    },
    'should work on an ampersand followed by another ampersand'
  )

  assert.deepEqual(
    check('Foo &'),
    {
      result: 'Foo &',
      reference: [],
      text: [['Foo &', position(1, 1, 0, 1, 6, 5)]],
      warning: []
    },
    'should work on an ampersand followed by EOF'
  )

  assert.deepEqual(
    check('Foo &"', {additional: '"'}),
    {
      result: 'Foo &"',
      reference: [],
      text: [['Foo &"', position(1, 1, 0, 1, 7, 6)]],
      warning: []
    },
    'should work on an ampersand followed by an additional character'
  )

  assert.deepEqual(
    check('foo&ampbar', {attribute: true}),
    {
      result: 'foo&ampbar',
      reference: [],
      text: [['foo&ampbar', position(1, 1, 0, 1, 11, 10)]],
      warning: []
    },
    'should work on an attribute #1'
  )

  assert.deepEqual(
    check('foo&amp;bar', {
      attribute: true
    }),
    {
      result: 'foo&bar',
      reference: [['&', position(1, 4, 3, 1, 9, 8), '&amp;']],
      text: [
        ['foo', position(1, 1, 0, 1, 4, 3)],
        ['bar', position(1, 9, 8, 1, 12, 11)]
      ],
      warning: []
    },
    'should work on an attribute #2'
  )

  assert.deepEqual(
    check('foo&amp;', {attribute: true}),
    {
      result: 'foo&',
      reference: [['&', position(1, 4, 3, 1, 9, 8), '&amp;']],
      text: [['foo', position(1, 1, 0, 1, 4, 3)]],
      warning: []
    },
    'should work on an attribute #3'
  )

  assert.deepEqual(
    check('foo&amp=', {attribute: true}),
    {
      result: 'foo&amp=',
      reference: [],
      text: [['foo&amp=', position(1, 1, 0, 1, 9, 8)]],
      warning: [
        [
          'Named character references must be terminated by a semicolon',
          point(1, 8, 7),
          1
        ]
      ]
    },
    'should work on an attribute #4'
  )

  assert.deepEqual(
    check('foo&amp', {attribute: true}),
    {
      result: 'foo&',
      reference: [['&', position(1, 4, 3, 1, 8, 7), '&amp']],
      text: [['foo', position(1, 1, 0, 1, 4, 3)]],
      warning: [
        [
          'Named character references must be terminated by a semicolon',
          point(1, 8, 7),
          1
        ]
      ]
    },
    'should work on an attribute #5'
  )

  assert.deepEqual(
    check('foo&amplol', {attribute: true}),
    {
      result: 'foo&amplol',
      reference: [],
      text: [['foo&amplol', position(1, 1, 0, 1, 11, 10)]],
      warning: []
    },
    'should work on an attribute #6'
  )

  assert.deepEqual(
    check('Foo &#'),
    {
      result: 'Foo &#',
      reference: [],
      text: [['Foo &#', position(1, 1, 0, 1, 7, 6)]],
      warning: [
        ['Numeric character references cannot be empty', point(1, 7, 6), 4]
      ]
    },
    'should warn when numeric and empty'
  )

  assert.deepEqual(
    check('Foo &='),
    {
      result: 'Foo &=',
      reference: [],
      text: [['Foo &=', position(1, 1, 0, 1, 7, 6)]],
      warning: []
    },
    'should not warn when empty and not numeric'
  )

  assert.deepEqual(
    check('Foo &bar; baz'),
    {
      result: 'Foo &bar; baz',
      reference: [],
      text: [['Foo &bar; baz', position(1, 1, 0, 1, 14, 13)]],
      warning: [['Named character references must be known', point(1, 6, 5), 5]]
    },
    'should warn when unknown and terminated'
  )

  assert.deepEqual(
    check('Foo &#xD800; baz'),
    {
      result: 'Foo \uFFFD baz',
      reference: [['\uFFFD', position(1, 5, 4, 1, 13, 12), '&#xD800;']],
      text: [
        ['Foo ', position(1, 1, 0, 1, 5, 4)],
        [' baz', position(1, 13, 12, 1, 17, 16)]
      ],
      warning: [
        [
          'Numeric character references cannot be outside the permissible ' +
            'Unicode range',
          point(1, 13, 12),
          7
        ]
      ]
    },
    'should warn when prohibited'
  )

  assert.deepEqual(
    check('Foo &#128; baz'),
    {
      result: 'Foo € baz',
      reference: [['€', position(1, 5, 4, 1, 11, 10), '&#128;']],
      text: [
        ['Foo ', position(1, 1, 0, 1, 5, 4)],
        [' baz', position(1, 11, 10, 1, 15, 14)]
      ],
      warning: [
        [
          'Numeric character references cannot be disallowed',
          point(1, 11, 10),
          6
        ]
      ]
    },
    'should warn when invalid'
  )

  assert.deepEqual(
    check('Foo &#xfdee; baz'),
    {
      result: 'Foo \uFDEE baz',
      reference: [['\uFDEE', position(1, 5, 4, 1, 13, 12), '&#xfdee;']],
      text: [
        ['Foo ', position(1, 1, 0, 1, 5, 4)],
        [' baz', position(1, 13, 12, 1, 17, 16)]
      ],
      warning: [
        [
          'Numeric character references cannot be disallowed',
          point(1, 13, 12),
          6
        ]
      ]
    },
    'should warn when disallowed'
  )

  assert.deepEqual(
    check('Foo &#x1F44D; baz'),
    {
      result: 'Foo 👍 baz',
      reference: [['👍', position(1, 5, 4, 1, 14, 13), '&#x1F44D;']],
      text: [
        ['Foo ', position(1, 1, 0, 1, 5, 4)],
        [' baz', position(1, 14, 13, 1, 18, 17)]
      ],
      warning: []
    },
    'should work when resulting in multiple characters'
  )

  assert.deepEqual(
    check('foo&amp;bar\n&not;baz', {
      position: point(3, 5, 12)
    }),
    {
      result: 'foo&bar\n¬baz',
      reference: [
        ['&', position(3, 8, 15, 3, 13, 20), '&amp;'],
        ['¬', position(4, 1, 24, 4, 6, 29), '&not;']
      ],
      text: [
        ['foo', position(3, 5, 12, 3, 8, 15)],
        ['bar\n', position(3, 13, 20, 4, 1, 24)],
        ['baz', position(4, 6, 29, 4, 9, 32)]
      ],
      warning: []
    },
    'when given positional information'
  )

  assert.deepEqual(
    check('foo&amp;bar\n&not;baz', {
      position: position(3, 5, 12, 4, 9, 32)
    }),
    {
      result: 'foo&bar\n¬baz',
      reference: [
        ['&', position(3, 8, 15, 3, 13, 20), '&amp;'],
        ['¬', position(4, 1, 24, 4, 6, 29), '&not;']
      ],
      text: [
        ['foo', position(3, 5, 12, 3, 8, 15)],
        ['bar\n', position(3, 13, 20, 4, 1, 24)],
        ['baz', position(4, 6, 29, 4, 9, 32)]
      ],
      warning: []
    },
    'when given location information'
  )

  assert.deepEqual(
    check('foo&amp;bar\n&not;baz', {
      position: {
        start: point(3, 5, 12),
        end: point(4, 9, 32),
        // To do: remove support next major.
        indent: [5]
      }
    }),
    {
      result: 'foo&bar\n¬baz',
      reference: [
        ['&', position(3, 8, 15, 3, 13, 20), '&amp;'],
        ['¬', position(4, 5, 24, 4, 10, 29), '&not;']
      ],
      text: [
        ['foo', position(3, 5, 12, 3, 8, 15)],
        ['bar\n', position(3, 13, 20, 4, 5, 24)],
        ['baz', position(4, 10, 29, 4, 13, 32)]
      ],
      warning: []
    },
    'when given indentation'
  )

  assert.deepEqual(
    check('I’m &notit; though'),
    {
      result: 'I’m ¬it; though',
      reference: [['¬', position(1, 5, 4, 1, 9, 8), '&not']],
      text: [
        ['I’m ', position(1, 1, 0, 1, 5, 4)],
        ['it; though', position(1, 9, 8, 1, 19, 18)]
      ],
      warning: [
        [
          'Named character references must be terminated by a semicolon',
          point(1, 9, 8),
          1
        ]
      ]
    },
    'example #1'
  )

  assert.deepEqual(
    check('I’m &notin; though'),
    {
      result: 'I’m ∉ though',
      reference: [['∉', position(1, 5, 4, 1, 12, 11), '&notin;']],
      text: [
        ['I’m ', position(1, 1, 0, 1, 5, 4)],
        [' though', position(1, 12, 11, 1, 19, 18)]
      ],
      warning: []
    },
    'example #2'
  )

  assert.deepEqual(
    check('I’m &AMPed though'),
    {
      result: 'I’m &ed though',
      reference: [['&', position(1, 5, 4, 1, 9, 8), '&AMP']],
      text: [
        ['I’m ', position(1, 1, 0, 1, 5, 4)],
        ['ed though', position(1, 9, 8, 1, 18, 17)]
      ],
      warning: [
        [
          'Named character references must be terminated by a semicolon',
          point(1, 9, 8),
          1
        ]
      ]
    },
    'legacy reference characters'
  )

  assert.deepEqual(
    check('I’m &circled though'),
    {
      result: 'I’m &circled though',
      reference: [],
      text: [['I’m &circled though', position(1, 1, 0, 1, 20, 19)]],
      warning: [
        ['Named character references cannot be empty', point(1, 6, 5), 3]
      ]
    },
    'non-legacy reference characters'
  )

  /**
   * @param {string} fixture
   * @param {Options} [options={}]
   */
  function check(fixture, options = {}) {
    const result = {
      result: '',
      /** @type {Array.<[string, Position, string]>} */
      reference: [],
      /** @type {Array.<[string, Position]>} */
      text: [],
      /** @type {Array.<[string, Point, number]>} */
      warning: []
    }

    /**
     * Construct an `add`er for `type`.
     * @param {'text' | 'reference' | 'warning'} type
     */
    function addFactory(type) {
      return add
      /**
       * @param {Array<unknown>} things
       */
      function add(...things) {
        // @ts-ignore
        result[type].push(things)
      }
    }

    options.text = addFactory('text')
    options.reference = addFactory('reference')
    options.warning = addFactory('warning')
    result.result = parseEntities(fixture, options)

    return result
  }
})

/**
 * Utility to create a `position`.
 * @param {number} aLine
 * @param {number} aColumn
 * @param {number} aOffset
 * @param {number} bLine
 * @param {number} bColumn
 * @param {number} bOffset
 */
// eslint-disable-next-line max-params
function position(aLine, aColumn, aOffset, bLine, bColumn, bOffset) {
  return {
    start: point(aLine, aColumn, aOffset),
    end: point(bLine, bColumn, bOffset)
  }
}

/**
 * Utility to create a `point`.
 * @param {number} line
 * @param {number} column
 * @param {number} offset
 */
function point(line, column, offset) {
  return {line, column, offset}
}
