var P = require('parsimmon')

// New line
var NEWLINE = P.string('\n').atLeast(1).or(P.eof)

/*
 * Indentation
 */

var INDENT = P.regex(/[\t\s]+/)

/*
 * Task tag
 *     "@done"
 */

var TAG = P.regex(/^@([^\s\n]+)/, 1)

/*
 * A string without @tags
 */

var NON_TAG_STRING = P.regex(/^(?:[^@\n][^\s\n]*)(?:\s+[^@\n][^\s\n]*)*/m)

/*
 * Project definition
 */

var PROJECT = P.seq(
    P.index,
    P.regex(/^([^\n]+?):/m, 1))
  .skip(NEWLINE)
  .map(function (ref) {
    var index = ref[0];
    var value = ref[1];

    var subp = P.seq(
      NON_TAG_STRING,
      P.optWhitespace,
      P.sepBy(TAG, P.whitespace)
    )
    .map(function (ref) {
      var value = ref[0];
      var _ = ref[1];
      var tags = ref[2];

      return ({ type: 'project', value: value, tags: tags, index: index });
    })

    return subp.parse(value).value
  })
  .desc('Project definition')

/*
 * Task definition
 *     "- hello @done"
 */

var TASK = P.seq(
  P.index,
  P.string('- '),
  NON_TAG_STRING,
  P.optWhitespace,
  P.sepBy(TAG, P.whitespace)
).skip(NEWLINE)
.map(function (ref) {
  var index = ref[0];
  var _ = ref[1];
  var value = ref[2];
  var __ = ref[3];
  var tags = ref[4];

  return ({ type: 'task', value: value, tags: tags, index: index });
})
.desc('Task definition')

/*
 * Note definition
 */

var NOTE = P.seq(
    P.index,
    P.regex(/^[^\n]+\n*/)
).map(function (ref) {
  var index = ref[0];
  var value = ref[1];

  return ({ type: 'note', value: value, index: index });
})
.desc('Note definition')

/*
 * A block
 */

function block (level, prefix) {
  if ( level === void 0 ) level = 0;
  if ( prefix === void 0 ) prefix = '';

  return parentBlock(level, prefix).or(leafBlock(level, prefix))
}

function leafBlock (level, prefix) {
  if ( level === void 0 ) level = 0;
  if ( prefix === void 0 ) prefix = '';

  return P.seq(
      P.string(prefix),
      level === 0 ? P.string('') : INDENT,
      NOTE)
    // Consolidate into one note node
    .map(function (ref) {
      var _pre = ref[0];
      var _ind = ref[1];
      var value = ref[2];

      return value;
  })
    .atLeast(1)
    .map(function (notes) { return ({
      type: 'note',
      value: notes.map(function (n) { return n.value; }).join('').trim() + '\n',
      index: notes[0].index
    }); })
}

function parentBlock (level, prefix) {
  if ( level === void 0 ) level = 0;
  if ( prefix === void 0 ) prefix = '';

  return P.seq(
    P.string(prefix),
    level === 0 ? P.string('') : INDENT,
    PROJECT.or(TASK)
  ).chain(function (ref) {
    var prefix = ref[0];
    var indent = ref[1];
    var item = ref[2];

    return block(level + 1, prefix + indent).many()
    .map(function (children) {
      var out = item
      out.children = children
      return out
    })
  })
}

var parser = block().many()

/*
 * Let's parse something
 */

function parse (str) {
  var out = parser.parse(str)
  if (out.status) {
    return { type: 'document', children: out.value }
  } else {
    var err = new Error(("Parse error in line " + (out.index.line)))
    err.index = out.index
    err.expected = out.expected
    throw err
  }
}

/*
 * Export
 */

module.exports = parse

