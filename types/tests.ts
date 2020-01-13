import decode = require('parse-entities')

decode('alpha &amp bravo')
decode('alpha &amp bravo', {additional: "''"})
decode('alpha &amp bravo', {attribute: true})

interface InvalidContext {
  invalid: string
}
const invalidContext: InvalidContext = {invalid: ''}

interface WarningContext {
  warning: string
}
const warningContext: WarningContext = {warning: ''}
function warning(
  this: WarningContext,
  reason: string,
  position: decode.Position
) {
  const stringData: string = this.warning
}

decode('alpha &amp bravo', {warning})
decode('alpha &amp bravo', {
  warning,
  warningContext
})
// prettier-ignore
// $ExpectError
decode('alpha &amp bravo', { warning, warningContext: invalidContext })

interface TextContext {
  text: string
}
const textContext: TextContext = {text: ''}
function text(this: TextContext, value: string, location: decode.Location) {
  const stringData: string = this.text
}

decode('alpha &amp bravo', {text})
decode('alpha &amp bravo', {
  text,
  textContext
})
// prettier-ignore
// $ExpectError
decode('alpha &amp bravo', { text, textContext: invalidContext })

interface ReferenceContext {
  reference: string
}
const referenceContext: ReferenceContext = {reference: ''}
function reference(
  this: ReferenceContext,
  value: string,
  location: decode.Location,
  source: decode.Location
) {
  const stringData: string = this.reference
}

decode('alpha &amp bravo', {reference})
decode('alpha &amp bravo', {
  reference,
  referenceContext
})
// prettier-ignore
// $ExpectError
decode('alpha &amp bravo', { reference, referenceContext: invalidContext })
