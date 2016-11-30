const test = require('tape')
const parse = require('./index')

  let result, expected

test('taskpaper', t => {
  result = parse('Project:\n  yo @true:\n  - ma @done @50%\n    thats right\n\n    :)')

  expected = { type: 'document',
    children:
     [ { type: 'project',
         value: 'Project',
         tags: [],
         index: { offset: 0, line: 1, column: 1 },
         children:
          [ { type: 'project',
              value: 'yo',
              tags: [ 'true' ],
              index: { offset: 11, line: 2, column: 3 },
              children: [] },
            { type: 'task',
              value: 'ma',
              tags: [ 'done', '50%' ],
              index: { offset: 23, line: 3, column: 3 },
              children:
               [ { type: 'note',
                   value: 'thats right\n\n:)\n',
                   index: { offset: 43, line: 4, column: 5 } } ] } ] } ] }

  t.deepEqual(result, expected)
  t.end()
})

test('project', t => {
  result = parse('Project name:')
  t.deepEqual(result.type, 'document')
  t.deepEqual(result.children[0].type, 'project')
  t.deepEqual(result.children[0].value, 'Project name')
  t.deepEqual(result.children[0].tags, [])
  t.deepEqual(result.children[0].index, { offset: 0, line: 1, column: 1 })

  t.end()
})

test('project tags', t => {
  result = parse('Project name @tag:')
  t.deepEqual(result.children[0].tags, ['tag'])
  t.end()
})

test('project tags, multiple', t => {
  result = parse('Project name @one @two:')
  t.deepEqual(result.children[0].tags, ['one', 'two'])
  t.end()
})

test('task tags', t => {
  result = parse('- Task name @tag')
  t.deepEqual(result.children[0].tags, ['tag'])
  t.end()
})

test('task tags, multiple', t => {
  result = parse('- Task name @one @two')
  t.deepEqual(result.children[0].tags, ['one', 'two'])
  t.end()
})

test('notes', t => {
  result = parse('Hello world')
  t.deepEqual(result.children[0].value, 'Hello world\n')
  t.end()
})

test('notes, multiline', t => {
  result = parse('Hello world\n:)')
  t.deepEqual(result.children[0].value, 'Hello world\n:)\n')
  t.end()
})

test('notes, multiple newlines', t => {
  result = parse('Hello world\n\n:)')
  t.deepEqual(result.children[0].value, 'Hello world\n\n:)\n')
  t.end()
})

test('notes, indent', t => {
  result = parse('Hello world\n\n    sup')
  t.deepEqual(result.children[0].value, 'Hello world\n\n    sup\n')
  t.end()
})
