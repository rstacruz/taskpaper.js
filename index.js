const P = require('parsimmon')

// New line
const NEWLINE = P.string('\n').atLeast(1).or(P.eof)

/*
 * Indentation
 */

const INDENT = P.regex(/[\t\s]+/)

/*
 * Task tag
 *     "@done"
 */

const TAG = P.regex(/@([^\(\s]+(\([^\)]*\))?)/, 1)

/*
 * A string without @tags
 */

const NON_TAG_STRING = P.regex(/(?:[^@\n][^\s\n]*)(?:[ \t]+[^@\n][^\s\n]*)*/)

const TAGS = P.seq(P.regexp(/[\t ]+/), TAG).map(([_, tag]) => tag).many()
/*
 * Project definition
 */

const PROJECT = P.seq(
    P.index,
    P.regex(/([^\n]+?):/, 1),
    TAGS)
  .skip(NEWLINE)
  .map(([index, value, tags]) => {
    return { type: 'project', value, tags, index }
  })
  .desc('Project definition')

/*
 * Task definition
 *     "- hello @done"
 */

const TASK = P.seq(
  P.index,
  P.string('- '),
  NON_TAG_STRING,
  TAGS
).skip(NEWLINE)
.map(([index, _, value, tags]) => ({ type: 'task', value, tags, index }))
.desc('Task definition')

/*
 * Note definition
 */

const NOTE = P.seq(
  P.index,
  P.regex(/[^-\n]([^\n]*[^:\n])?\n*/)
).map(([index, value]) => ({ type: 'note', value, index }))
.desc('Note definition')

/*
 * A block
 */

function block (depth = 1, prefix = '') {
  return parentBlock(depth, prefix).or(leafBlock(depth, prefix))
}

function leafBlock (depth = 1, prefix = '') {
  return P.seq(
      P.string(prefix),
      depth === 1 ? P.string('') : INDENT,
      NOTE)
    // Consolidate into one note node
    .map(([_pre, _ind, value]) => value)
    .atLeast(1)
    .map(notes => ({
      type: 'note',
      value: notes.map(n => n.value).join('').trim() + '\n',
      depth,
      index: notes[0].index
    }))
}

function parentBlock (depth = 1, prefix = '') {
  return P.seq(
    P.string(prefix),
    depth === 1 ? P.string('') : INDENT,
    PROJECT.or(TASK)
  ).chain(([prefix, indent, item]) => {
    return block(depth + 1, prefix + indent).many()
    .map(children => {
      let out = item
      out.depth = depth
      out.children = children
      return out
    })
  })
}

const parser = block().many()

/*
 * Let's parse something
 */

function parse (str) {
  const out = parser.parse(str)
  if (out.status) {
    return { type: 'document', depth: 0, children: out.value }
  } else {
    let err = new Error(`Parse error in line ${out.index.line}, expected ${out.expected.join(' or ')}`)
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
