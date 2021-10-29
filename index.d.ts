import type {Point, Position} from 'unist'

/**
 * @typeParam Context
 *   Value used as `this`.
 * @this
 *   The `warningContext` given to `parseEntities`
 * @param reason
 *   Human-readable reason for triggering a parse error.
 * @param point
 *   Place at which the parse error occurred.
 * @param code
 *   Identifier of reason for triggering a parse error.
 */
export type WarningHandler<Context = undefined> = (
  this: Context,
  reason: string,
  point: Point,
  code: number
) => void

/**
 * @typeParam Context
 *   Value used as `this`.
 * @this
 *   The `referenceContext` given to `parseEntities`
 * @param value
 *   String of content.
 * @param position
 *   Place at which `value` starts and ends.
 * @param source
 *   Source of character reference.
 */
export type ReferenceHandler<Context = undefined> = (
  this: Context,
  value: string,
  position: Position,
  source: string
) => void

/**
 * @typeParam Context
 *   Value used as `this`.
 * @this
 *   The `textContext` given to `parseEntities`
 * @param value
 *   String of content.
 * @param point
 *   Place at which `value` starts and ends.
 */
export type TextHandler<Context = undefined> = (
  this: Context,
  value: string,
  position: Position
) => void

/**
 * Configuration.
 *
 * @typeParam WarningContext
 *   Value used as `this` in the `warning` handler.
 * @typeParam ReferenceContext
 *   Value used as `this` in the `reference` handler.
 * @typeParam TextContext
 *   Value used as `this` in the `text` handler.
 */
export type Options<
  WarningContext = undefined,
  ReferenceContext = undefined,
  TextContext = undefined
> = {
  /**
   * Additional character to accept. This allows other characters, without error, when following an ampersand.
   *
   * @default ''
   */
  additional?: string
  /**
   * Whether to parse `value` as an attribute value.
   *
   * @default false
   */
  attribute?: boolean
  /**
   * Whether to allow non-terminated entities. For example, `&copycat` for `©cat`. This behaviour is spec-compliant but can lead to unexpected results
   *
   * @default true
   */
  nonTerminated?: boolean
  /**
   * Starting `position` of `value` (`Point` or `Position`). Useful when dealing with values nested in some sort of syntax tree.
   */
  position?: Position | Point
  /**
   * Context used when calling `warning`.
   */
  warningContext?: WarningContext
  /**
   * Context used when calling `reference`.
   */
  referenceContext?: ReferenceContext
  /**
   * Context used when calling `text`.
   */
  textContext?: TextContext
  /**
   * Warning handler.
   */
  warning?: WarningHandler<WarningContext>
  /**
   * Reference handler.
   */
  reference?: ReferenceHandler<ReferenceContext>
  /**
   * Text handler.
   */
  text?: TextHandler<TextContext>
}

export {parseEntities} from './lib/index.js'
export {decodeEntity} from './lib/decode-entity.js'
