# parse-entities

[![Build][badge-build-image]][badge-build-url]
[![Coverage][badge-coverage-image]][badge-coverage-url]
[![Downloads][badge-downloads-image]][badge-downloads-url]
[![Size][badge-size-image]][badge-size-url]

Parse HTML character references.

## Contents

* [What is this?](#what-is-this)
* [When should I use this?](#when-should-i-use-this)
* [Install](#install)
* [Use](#use)
* [API](#api)
* [`Options`](#options)
  * [`parseEntities(value[, options])`](#parseentitiesvalue-options)
* [Compatibility](#compatibility)
* [Security](#security)
* [Related](#related)
* [Contribute](#contribute)
* [License](#license)

## What is this?

This is a small and powerful decoder of HTML character references (often called
entities).

## When should I use this?

You can use this for spec-compliant decoding of character references.
It’s small and fast enough to do that well.
You can also use this when making a linter, because there are different warnings
emitted with reasons for why and positional info on where they happened.

## Install

This package is [ESM only][github-gist-esm].
In Node.js (version 16+),
install with [npm][npmjs-install]:

```sh
npm install parse-entities
```

In Deno with [`esm.sh`][esmsh]:

```js
import {parseEntities} from 'https://esm.sh/parse-entities@3'
```

In browsers with [`esm.sh`][esmsh]:

```html
<script type="module">
  import {parseEntities} from 'https://esm.sh/parse-entities@3?bundle'
</script>
```

## Use

```js
import {parseEntities} from 'parse-entities'

console.log(parseEntities('alpha &amp bravo')))
// => alpha & bravo

console.log(parseEntities('charlie &copycat; delta'))
// => charlie ©cat; delta

console.log(parseEntities('echo &copy; foxtrot &#8800; golf &#x1D306; hotel'))
// => echo © foxtrot ≠ golf 𝌆 hotel
```

## API

This package exports the identifier
[`parseEntities`][api-parse-entities].
It also exports the [TypeScript][] types
[`Options`][api-options],
[`ReferenceHandler`][api-reference-handler],
[`TextHandler`][api-text-handler], and
[`WarningHandler`][api-warning-handler].
There is no default export.

## `Options`

Configuration (TypeScript type).

##### Fields

###### `options.additional`

Additional character to accept (`string`, default: `''`).
This allows other characters, without error, when following an ampersand.

###### `options.attribute`

Whether to parse `value` as an attribute value (`boolean`, default: `false`).
This results in slightly different behavior.

###### `options.nonTerminated`

Whether to allow nonterminated references (`boolean`, default: `true`).
For example, `&copycat` for `©cat`.
This behavior is compliant to the spec but can lead to unexpected results.

###### `options.position`

Starting `position` of `value` (`Point` or `Position`, optional).
Useful when dealing with values nested in some sort of syntax tree.
The default is:

```js
{line: 1, column: 1, offset: 0}
```

###### `options.referenceContext`

Context used when calling `reference` (`unknown`, optional)

###### `options.reference`

Reference handler ([`ReferenceHandler`][api-reference-handler], optional).

###### `options.textContext`

Context used when calling `text` (`unknown`, optional).

###### `options.text`

Text handler ([`TextHandler`][api-text-handler], optional).

###### `options.warningContext`

Context used when calling `warning` (`unknown`, optional).

###### `options.warning`

Error handler ([`WarningHandler`][api-warning-handler], optional).

### `parseEntities(value[, options])`

Parse HTML character references.

###### Parameters

* `value` (`string`)
  — value to decode
* `options` ([`Options`][api-options], optional)
  — configuration

##### Returns

Decoded `value` (`string`).

#### `ReferenceHandler`

Character reference handler.

###### Parameters

* `this` (`*`)
  — refers to `referenceContext` when given to `parseEntities`
* `value` (`string`)
  — decoded character reference
* `position` ([`Position`][github-unist-position])
  — place where `source` starts and ends
* `source` (`string`)
  — raw source of character reference

#### `TextHandler`

Text handler.

###### Parameters

* `this` (`*`)
  — refers to `textContext` when given to `parseEntities`
* `value` (`string`)
  — string of content
* `position` ([`Position`][github-unist-position])
  — place where `value` starts and ends

#### `WarningHandler`

Error handler.

###### Parameters

* `this` (`*`)
  — refers to `warningContext` when given to `parseEntities`
* `reason` (`string`)
  — human readable reason for emitting a parse error
* `point` ([`Point`][github-unist-point])
  — place where the error occurred
* `code` (`number`)
  — machine readable code the error

The following codes are used:

| Code | Example            | Note                                          |
| ---- | ------------------ | --------------------------------------------- |
| `1`  | `foo &amp bar`     | Missing semicolon (named)                     |
| `2`  | `foo &#123 bar`    | Missing semicolon (numeric)                   |
| `3`  | `Foo &bar baz`     | Empty (named)                                 |
| `4`  | `Foo &#`           | Empty (numeric)                               |
| `5`  | `Foo &bar; baz`    | Unknown (named)                               |
| `6`  | `Foo &#128; baz`   | [Disallowed reference][invalid]               |
| `7`  | `Foo &#xD800; baz` | Prohibited: outside permissible unicode range |

## Compatibility

This project is compatible with maintained versions of Node.js.

When we cut a new major release,
we drop support for unmaintained versions of Node.
This means we try to keep the current release line,
`parse-entities@4`,
compatible with Node.js 16.

## Security

This package is safe: it matches the HTML spec to parse character references.

## Related

* [`wooorm/stringify-entities`](https://github.com/wooorm/stringify-entities)
  — encode HTML character references
* [`wooorm/character-entities`](https://github.com/wooorm/character-entities)
  — info on character references
* [`wooorm/character-entities-html4`](https://github.com/wooorm/character-entities-html4)
  — info on HTML4 character references
* [`wooorm/character-entities-legacy`](https://github.com/wooorm/character-entities-legacy)
  — info on legacy character references
* [`wooorm/character-reference-invalid`][invalid]
  — info on invalid numeric character references

## Contribute

Yes please!
See [How to Contribute to Open Source][opensource-guide-contribute].

## License

[MIT][file-license] © [Titus Wormer][wooorm]

<!-- Definitions -->

[api-options]: #options

[api-parse-entities]: #parseentitiesvalue-options

[api-reference-handler]: #referencehandler

[api-text-handler]: #texthandler

[api-warning-handler]: #warninghandler

[badge-build-image]: https://github.com/wooorm/parse-entities/workflows/main/badge.svg

[badge-build-url]: https://github.com/wooorm/parse-entities/actions

[badge-coverage-image]: https://img.shields.io/codecov/c/github/wooorm/parse-entities.svg

[badge-coverage-url]: https://codecov.io/github/wooorm/parse-entities

[badge-downloads-image]: https://img.shields.io/npm/dm/parse-entities.svg

[badge-downloads-url]: https://www.npmjs.com/package/parse-entities

[badge-size-image]: https://img.shields.io/bundlejs/size/parse-entities?exports=createStarryNight

[badge-size-url]: https://bundlejs.com/?q=parse-entities

[esmsh]: https://esm.sh

[file-license]: license

[github-gist-esm]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c

[github-unist-point]: https://github.com/syntax-tree/unist#point

[github-unist-position]: https://github.com/syntax-tree/unist#position

[invalid]: https://github.com/wooorm/character-reference-invalid

[npmjs-install]: https://docs.npmjs.com/cli/install

[opensource-guide-contribute]: https://opensource.guide/how-to-contribute/

[typescript]: https://www.typescriptlang.org

[wooorm]: https://wooorm.com
