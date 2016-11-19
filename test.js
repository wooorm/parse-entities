'use strict';

/* eslint-disable max-params */

/* Dependencies. */
var test = require('tape');
var decode = require('./');

/* Tests. */
test('parseEntities(value)', function (t) {
  t.equal(
    decode('I’m &notit; though'),
    'I’m ¬it; though',
    'example #1 (without options)'
  );

  t.equal(
    decode('I’m &notin; though'),
    'I’m ∉ though',
    'example #2 (without options)'
  );

  t.deepEqual(assert('foo &amp; bar'), {
    result: 'foo & bar',
    reference: [
      ['&', location(1, 5, 4, 1, 10, 9), '&amp;']
    ],
    text: [
      ['foo ', location(1, 1, 0, 1, 5, 4)],
      [' bar', location(1, 10, 9, 1, 14, 13)]
    ],
    warning: []
  }, 'should work on a named reference');

  t.deepEqual(assert('foo &#123; bar'), {
    result: 'foo { bar',
    reference: [
      ['{', location(1, 5, 4, 1, 11, 10), '&#123;']
    ],
    text: [
      ['foo ', location(1, 1, 0, 1, 5, 4)],
      [' bar', location(1, 11, 10, 1, 15, 14)]
    ],
    warning: []
  }, 'should work on a decimal reference');

  t.deepEqual(assert('foo &#x123; bar'), {
    result: 'foo ģ bar',
    reference: [
      ['ģ', location(1, 5, 4, 1, 12, 11), '&#x123;']
    ],
    text: [
      ['foo ', location(1, 1, 0, 1, 5, 4)],
      [' bar', location(1, 12, 11, 1, 16, 15)]
    ],
    warning: []
  }, 'should work on a hexadecimal reference');

  t.deepEqual(assert('&amp; bar'), {
    result: '& bar',
    reference: [
      ['&', location(1, 1, 0, 1, 6, 5), '&amp;']
    ],
    text: [
      [' bar', location(1, 6, 5, 1, 10, 9)]
    ],
    warning: []
  }, 'should work when the entity is initial');

  t.deepEqual(assert('foo &amp;'), {
    result: 'foo &',
    reference: [
      ['&', location(1, 5, 4, 1, 10, 9), '&amp;']
    ],
    text: [
      ['foo ', location(1, 1, 0, 1, 5, 4)]
    ],
    warning: []
  }, 'should work when the entity is final');

  t.deepEqual(assert('&amp;&#123;&#x123;'), {
    result: '&{ģ',
    reference: [
      ['&', location(1, 1, 0, 1, 6, 5), '&amp;'],
      ['{', location(1, 6, 5, 1, 12, 11), '&#123;'],
      ['ģ', location(1, 12, 11, 1, 19, 18), '&#x123;']
    ],
    text: [],
    warning: []
  }, 'should work for adjacent entities');

  t.deepEqual(assert('foo &amp bar'), {
    result: 'foo & bar',
    reference: [
      ['&', location(1, 5, 4, 1, 9, 8), '&amp']
    ],
    text: [
      ['foo ', location(1, 1, 0, 1, 5, 4)],
      [' bar', location(1, 9, 8, 1, 13, 12)]
    ],
    warning: [[
      'Named character references must be terminated by a semicolon',
      position(1, 9, 8),
      1
    ]]
  }, 'should work when named but warn without terminal semicolon');

  t.deepEqual(assert('foo &amp bar', {nonTerminated: false}), {
    result: 'foo &amp bar',
    reference: [],
    text: [
      ['foo &amp bar', location(1, 1, 0, 1, 13, 12)]
    ],
    warning: []
  }, 'should work if `nonTerminated` is given');

  t.deepEqual(assert('foo &#123 bar'), {
    result: 'foo { bar',
    reference: [
      ['{', location(1, 5, 4, 1, 10, 9), '&#123']
    ],
    text: [
      ['foo ', location(1, 1, 0, 1, 5, 4)],
      [' bar', location(1, 10, 9, 1, 14, 13)]
    ],
    warning: [[
      'Numeric character references must be terminated by a semicolon',
      position(1, 10, 9),
      2
    ]]
  }, 'should fail when numerical and without terminal semicolon');

  t.deepEqual(assert('Foo &\tbar'), {
    result: 'Foo &\tbar',
    reference: [],
    text: [
        ['Foo &\tbar', location(1, 1, 0, 1, 10, 9)]
    ],
    warning: []
  }, 'should work on an ampersand followed by a tab');

  t.deepEqual(assert('Foo &\nbar'), {
    result: 'Foo &\nbar',
    reference: [],
    text: [
      ['Foo &\nbar', location(1, 1, 0, 2, 4, 9)]
    ],
    warning: []
  }, 'should work on an ampersand followed by a newline');

  t.deepEqual(assert('Foo &\fbar'), {
    result: 'Foo &\fbar',
    reference: [],
    text: [
      ['Foo &\fbar', location(1, 1, 0, 1, 10, 9)]
    ],
    warning: []
  }, 'should work on an ampersand followed by a form-feed');

  t.deepEqual(assert('Foo & bar'), {
    result: 'Foo & bar',
    reference: [],
    text: [
      ['Foo & bar', location(1, 1, 0, 1, 10, 9)]
    ],
    warning: []
  }, 'should work on an ampersand followed by a space');

  t.deepEqual(assert('Foo &<bar'), {
    result: 'Foo &<bar',
    reference: [],
    text: [
      ['Foo &<bar', location(1, 1, 0, 1, 10, 9)]
    ],
    warning: []
  }, 'should work on an ampersand followed by a `<`');

  t.deepEqual(assert('Foo &&bar'), {
    result: 'Foo &&bar',
    reference: [],
    text: [
      ['Foo &&bar', location(1, 1, 0, 1, 10, 9)]
    ],
    /* The warning here is for the following ampersand,
     * followed by `bar`, which is not an entity. */
    warning: [[
      'Named character references cannot be empty',
      position(1, 7, 6),
      3
    ]]
  }, 'should work on an ampersand followed by another ampersand');

  t.deepEqual(assert('Foo &'), {
    result: 'Foo &',
    reference: [],
    text: [
      ['Foo &', location(1, 1, 0, 1, 6, 5)]
    ],
    warning: []
  }, 'should work on an ampersand followed by EOF');

  t.deepEqual(assert('Foo &"', {additional: '"'}), {
    result: 'Foo &"',
    reference: [],
    text: [
      ['Foo &"', location(1, 1, 0, 1, 7, 6)]
    ],
    warning: []
  }, 'should work on an ampersand followed by an additional character');

  t.deepEqual(assert('foo&ampbar', {attribute: true}), {
    result: 'foo&ampbar',
    reference: [],
    text: [
      ['foo&ampbar', location(1, 1, 0, 1, 11, 10)]
    ],
    warning: []
  }, 'should work on an attribute #1');

  t.deepEqual(assert('foo&amp;bar', {
    attribute: true
  }), {
    result: 'foo&bar',
    reference: [
      ['&', location(1, 4, 3, 1, 9, 8), '&amp;']
    ],
    text: [
      ['foo', location(1, 1, 0, 1, 4, 3)],
      ['bar', location(1, 9, 8, 1, 12, 11)]
    ],
    warning: []
  }, 'should work on an attribute #2');

  t.deepEqual(assert('foo&amp;', {attribute: true}), {
    result: 'foo&',
    reference: [
      ['&', location(1, 4, 3, 1, 9, 8), '&amp;']
    ],
    text: [
      ['foo', location(1, 1, 0, 1, 4, 3)]
    ],
    warning: []
  }, 'should work on an attribute #3');

  t.deepEqual(assert('foo&amp=', {attribute: true}), {
    result: 'foo&amp=',
    reference: [],
    text: [
      ['foo&amp=', location(1, 1, 0, 1, 9, 8)]
    ],
    warning: [[
      'Named character references must be terminated by a semicolon',
      position(1, 8, 7),
      1
    ]]
  }, 'should work on an attribute #4');

  t.deepEqual(assert('foo&amp', {attribute: true}), {
    result: 'foo&',
    reference: [
      ['&', location(1, 4, 3, 1, 8, 7), '&amp']
    ],
    text: [
      ['foo', location(1, 1, 0, 1, 4, 3)]
    ],
    warning: [[
      'Named character references must be terminated by a semicolon',
      position(1, 8, 7),
      1
    ]]
  }, 'should work on an attribute #5');

  t.deepEqual(assert('foo&amplol', {attribute: true}), {
    result: 'foo&amplol',
    reference: [],
    text: [
      ['foo&amplol', location(1, 1, 0, 1, 11, 10)]
    ],
    warning: []
  }, 'should work on an attribute #6');

  t.deepEqual(assert('Foo &#'), {
    result: 'Foo &#',
    reference: [],
    text: [
      ['Foo &#', location(1, 1, 0, 1, 7, 6)]
    ],
    warning: [[
      'Numeric character references cannot be empty',
      position(1, 7, 6),
      4
    ]]
  }, 'should warn when numeric and empty');

  t.deepEqual(assert('Foo &='), {
    result: 'Foo &=',
    reference: [],
    text: [
      ['Foo &=', location(1, 1, 0, 1, 7, 6)]
    ],
    warning: []
  }, 'should not warn when empty and not numeric');

  t.deepEqual(assert('Foo &bar; baz'), {
    result: 'Foo &bar; baz',
    reference: [],
    text: [
      ['Foo &bar; baz', location(1, 1, 0, 1, 14, 13)]
    ],
    warning: [[
      'Named character references must be known',
      position(1, 6, 5),
      5
    ]]
  }, 'should warn when unknown and terminated');

  t.deepEqual(assert('Foo &#xD800; baz'), {
    result: 'Foo \uFFFD baz',
    reference: [
      ['\uFFFD', location(1, 5, 4, 1, 13, 12), '&#xD800;']
    ],
    text: [
      ['Foo ', location(1, 1, 0, 1, 5, 4)],
      [' baz', location(1, 13, 12, 1, 17, 16)]
    ],
    warning: [[
      'Numeric character references cannot be outside the permissible ' +
      'Unicode range',
      position(1, 13, 12),
      7
    ]]
  }, 'should warn when prohibited');

  t.deepEqual(assert('Foo &#128; baz'), {
    result: 'Foo € baz',
    reference: [
      ['€', location(1, 5, 4, 1, 11, 10), '&#128;']
    ],
    text: [
      ['Foo ', location(1, 1, 0, 1, 5, 4)],
      [' baz', location(1, 11, 10, 1, 15, 14)]
    ],
    warning: [[
      'Numeric character references cannot be disallowed',
      position(1, 11, 10),
      6
    ]]
  }, 'should warn when invalid');

  t.deepEqual(assert('Foo &#xfdee; baz'), {
    result: 'Foo \uFDEE baz',
    reference: [
      ['\uFDEE', location(1, 5, 4, 1, 13, 12), '&#xfdee;']
    ],
    text: [
      ['Foo ', location(1, 1, 0, 1, 5, 4)],
      [' baz', location(1, 13, 12, 1, 17, 16)]
    ],
    warning: [[
      'Numeric character references cannot be disallowed',
      position(1, 13, 12),
      6
    ]]
  }, 'should warn when disallowed');

  t.deepEqual(assert('Foo &#x1F44D; baz'), {
    result: 'Foo 👍 baz',
    reference: [
      ['👍', location(1, 5, 4, 1, 14, 13), '&#x1F44D;']
    ],
    text: [
      ['Foo ', location(1, 1, 0, 1, 5, 4)],
      [' baz', location(1, 14, 13, 1, 18, 17)]
    ],
    warning: []
  }, 'should work when resulting in multiple characters');

  t.deepEqual(assert('foo&amp;bar\n&not;baz', {
    position: position(3, 5, 12)
  }), {
    result: 'foo&bar\n¬baz',
    reference: [
      ['&', location(3, 8, 15, 3, 13, 20), '&amp;'],
      ['¬', location(4, 1, 24, 4, 6, 29), '&not;']
    ],
    text: [
      ['foo', location(3, 5, 12, 3, 8, 15)],
      ['bar\n', location(3, 13, 20, 4, 1, 24)],
      ['baz', location(4, 6, 29, 4, 9, 32)]
    ],
    warning: []
  }, 'when given positional information');

  t.deepEqual(assert('foo&amp;bar\n&not;baz', {
    position: location(3, 5, 12, 4, 9, 32)
  }), {
    result: 'foo&bar\n¬baz',
    reference: [
      ['&', location(3, 8, 15, 3, 13, 20), '&amp;'],
      ['¬', location(4, 1, 24, 4, 6, 29), '&not;']
    ],
    text: [
      ['foo', location(3, 5, 12, 3, 8, 15)],
      ['bar\n', location(3, 13, 20, 4, 1, 24)],
      ['baz', location(4, 6, 29, 4, 9, 32)]
    ],
    warning: []
  }, 'when given location information');

  t.deepEqual(assert('foo&amp;bar\n&not;baz', {
    position: {
      start: position(3, 5, 12),
      end: position(4, 9, 32),
      indent: [5]
    }
  }), {
    result: 'foo&bar\n¬baz',
    reference: [
      ['&', location(3, 8, 15, 3, 13, 20), '&amp;'],
      ['¬', location(4, 5, 24, 4, 10, 29), '&not;']
    ],
    text: [
      ['foo', location(3, 5, 12, 3, 8, 15)],
      ['bar\n', location(3, 13, 20, 4, 5, 24)],
      ['baz', location(4, 10, 29, 4, 13, 32)]
    ],
    warning: []
  }, 'when given indentation');

  t.deepEqual(assert('I’m &notit; though'), {
    result: 'I’m ¬it; though',
    reference: [
      ['¬', location(1, 5, 4, 1, 9, 8), '&not']
    ],
    text: [
      ['I’m ', location(1, 1, 0, 1, 5, 4)],
      ['it; though', location(1, 9, 8, 1, 19, 18)]
    ],
    warning: [[
      'Named character references must be terminated by a semicolon',
      position(1, 9, 8),
      1
    ]]
  }, 'example #1');

  t.deepEqual(assert('I’m &notin; though'), {
    result: 'I’m ∉ though',
    reference: [
      ['∉', location(1, 5, 4, 1, 12, 11), '&notin;']
    ],
    text: [
      ['I’m ', location(1, 1, 0, 1, 5, 4)],
      [' though', location(1, 12, 11, 1, 19, 18)]
    ],
    warning: []
  }, 'example #2');

  t.deepEqual(assert('I’m &AMPed though'), {
    result: 'I’m &ed though',
    reference: [
      ['&', location(1, 5, 4, 1, 9, 8), '&AMP']
    ],
    text: [
      ['I’m ', location(1, 1, 0, 1, 5, 4)],
      ['ed though', location(1, 9, 8, 1, 18, 17)]
    ],
    warning: [[
      'Named character references must be terminated by a semicolon',
      position(1, 9, 8),
      1
    ]]
  }, 'legacy entity characters');

  t.deepEqual(assert('I’m &circled though'), {
    result: 'I’m &circled though',
    reference: [],
    text: [
      ['I’m &circled though', location(1, 1, 0, 1, 20, 19)]
    ],
    warning: [[
      'Named character references cannot be empty',
      position(1, 6, 5),
      3
    ]]
  }, 'non-legacy entity characters');

  t.end();

  /* assert a fixture. */
  function assert(fixture, options) {
    var settings = options || {};
    var result = {
      text: [],
      reference: [],
      warning: []
    };

    /* Construct an `add`er for `type`. */
    function addFactory(type) {
      return function () {
        result[type].push([].slice.apply(arguments));
      };
    }

    settings.text = addFactory('text');
    settings.reference = addFactory('reference');
    settings.warning = addFactory('warning');

    result.result = decode(fixture, settings);

    return result;
  }
});

/* Utility to create a `location`. */
function location(aLine, aColumn, aOffset, bLine, bColumn, bOffset) {
  return {
    start: position(aLine, aColumn, aOffset),
    end: position(bLine, bColumn, bOffset)
  };
}

/* Utility to create a `position`. */
function position(line, column, offset) {
  return {line: line, column: column, offset: offset};
}
