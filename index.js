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

const TAG = P.regex(/^@([^\s\n]+)/, 1)

/*
 * A string without @tags
 */

const NON_TAG_STRING = P.regex(/^(?:[^@\n][^\s\n]*)(?:\s+[^@\n][^\s\n]*)*/m)

/*
 * Project definition
 */

const PROJECT = P.seq(
    P.index,
    P.regex(/^([^\n]+?):/m, 1))
  .skip(NEWLINE)
  .map(([index, value]) => {
    const subp = P.seq(
      NON_TAG_STRING,
      P.optWhitespace,
      P.sepBy(TAG, P.whitespace)
    )
    .map(([value, _, tags]) => ({ type: 'project', value, tags, index }))

    return subp.parse(value).value
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
  P.optWhitespace,
  P.sepBy(TAG, P.whitespace)
).skip(NEWLINE)
.map(([index, _, value, __, tags]) => ({ type: 'task', value, tags, index }))
.desc('Task definition')

/*
 * Note definition
 */

const NOTE = P.seq(
    P.index,
    P.regex(/^[^\n]+\n*/)
).map(([index, value]) => ({ type: 'note', value, index }))
.desc('Note definition')

/*
 * A block
 */

function block (level = 0, prefix = '') {
  return parentBlock(level, prefix).or(leafBlock(level, prefix))
}

function leafBlock (level = 0, prefix = '') {
  return P.seq(
      P.string(prefix),
      level === 0 ? P.string('') : INDENT,
      NOTE)
    // Consolidate into one note node
    .map(([_pre, _ind, value]) => value)
    .atLeast(1)
    .map(notes => ({
      type: 'note',
      value: notes.map(n => n.value).join('').trim() + '\n',
      index: notes[0].index
    }))
}

function parentBlock (level = 0, prefix = '') {
  return P.seq(
    P.string(prefix),
    level === 0 ? P.string('') : INDENT,
    PROJECT.or(TASK)
  ).chain(([prefix, indent, item]) => {
    return block(level + 1, prefix + indent).many()
    .map(children => {
      let out = item
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
    return { type: 'document', children: out.value }
  } else {
    return { error: 'Parse error', index: out.index, expected: out.expected }
  }
}

/*
 * Export
 */

module.exports = parse
