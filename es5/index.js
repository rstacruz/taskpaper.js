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

var TAG = P.regex(/@([^\s\n]+)/, 1)

/*
 * A string without @tags
 */

var NON_TAG_STRING = P.regex(/(?:[^@\n][^\s\n]*)(?:[ \t]+[^@\n][^\s\n]*)*/)

var TAGS = P.seq(P.regexp(/[\t ]+/), TAG).map(function (ref) {
  var _ = ref[0];
  var tag = ref[1];

  return tag;
}).many()
/*
 * Project definition
 */

var PROJECT = P.seq(
    P.index,
    P.regex(/([^\n]+?):/, 1),
    TAGS)
  .skip(NEWLINE)
  .map(function (ref) {
    var index = ref[0];
    var value = ref[1];
    var tags = ref[2];

    return { type: 'project', value: value, tags: tags, index: index }
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
  TAGS
).skip(NEWLINE)
.map(function (ref) {
  var index = ref[0];
  var _ = ref[1];
  var value = ref[2];
  var tags = ref[3];

  return ({ type: 'task', value: value, tags: tags, index: index });
})
.desc('Task definition')

/*
 * Note definition
 */

var NOTE = P.seq(
  P.index,
  P.regex(/[^-\n]([^\n]*[^:\n])?\n*/)
).map(function (ref) {
  var index = ref[0];
  var value = ref[1];

  return ({ type: 'note', value: value, index: index });
})
.desc('Note definition')

/*
 * A block
 */

function block (depth, prefix) {
  if ( depth === void 0 ) depth = 1;
  if ( prefix === void 0 ) prefix = '';

  return parentBlock(depth, prefix).or(leafBlock(depth, prefix))
}

function leafBlock (depth, prefix) {
  if ( depth === void 0 ) depth = 1;
  if ( prefix === void 0 ) prefix = '';

  return P.seq(
      P.string(prefix),
      depth === 1 ? P.string('') : INDENT,
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
      depth: depth,
      index: notes[0].index
    }); })
}

function parentBlock (depth, prefix) {
  if ( depth === void 0 ) depth = 1;
  if ( prefix === void 0 ) prefix = '';

  return P.seq(
    P.string(prefix),
    depth === 1 ? P.string('') : INDENT,
    PROJECT.or(TASK)
  ).chain(function (ref) {
    var prefix = ref[0];
    var indent = ref[1];
    var item = ref[2];

    return block(depth + 1, prefix + indent).many()
    .map(function (children) {
      var out = item
      out.depth = depth
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
    return { type: 'document', depth: 0, children: out.value }
  } else {
    var err = new Error(("Parse error in line " + (out.index.line) + ", expected " + (out.expected.join(' or '))))
    err.index = out.index
    err.expected = out.expected
    err.source = str
    throw err
  }
}

/*
 * Export
 */

module.exports = parse

