const test = require('tape')
const parse = require('./index')
const redent = require('redent')

let result, expected

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
  result = parse('Project name: @tag')
  t.deepEqual(result.children[0].tags, ['tag'])
  t.end()
})

test('project tags, multiple', t => {
  result = parse('Project name: @one @two')
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

test('notes and task', t => {
  result = parse('Project:\n  hello\n  - task')
  t.deepEqual(result.children[0].children[0].type, 'note')
  t.deepEqual(result.children[0].children[1].type, 'task')
  t.end()
})

test('task tree', t => {
  result = parse('Project:\n  - task 1\n  - task 2\n    - subtask\n')
  t.deepEqual(result.children[0].type, 'project')
  t.deepEqual(result.children[0].depth, 1)
  t.deepEqual(result.children[0].children[0].type, 'task')
  t.deepEqual(result.children[0].children[0].depth, 2)
  t.deepEqual(result.children[0].children[1].type, 'task')
  t.deepEqual(result.children[0].children[1].depth, 2)
  t.deepEqual(result.children[0].children[1].children[0].type, 'task')
  t.deepEqual(result.children[0].children[1].children[0].depth, 3)
  t.end()
})

test('fully-loaded', t => {
  result = parse('Project:\n  yo: @true\n  - ma @done @50%\n    thats right\n\n    :)')

  expected = { type: 'document',
    depth: 0,
    children:
     [ { type: 'project',
         value: 'Project',
         tags: [],
         depth: 1,
         index: { offset: 0, line: 1, column: 1 },
         children:
          [ { type: 'project',
              value: 'yo',
              tags: [ 'true' ],
              depth: 2,
              index: { offset: 11, line: 2, column: 3 },
              children: [] },
            { type: 'task',
              value: 'ma',
              tags: [ 'done', '50%' ],
              depth: 2,
              index: { offset: 23, line: 3, column: 3 },
              children:
               [ { type: 'note',
                   value: 'thats right\n\n:)\n',
                  depth: 3,
                   index: { offset: 43, line: 4, column: 5 } } ] } ] } ] }

  t.deepEqual(result, expected)
  t.end()
})

test('weird case', t => {
  const input = redent(`
    A:
      B B:
        - Signup @xxx @xx

      xxxxxx xxxxxxx:
  `).trim()

  result = parse(input)
  t.deepEqual(result.children[0].children[0].children[0].value, 'Signup')

  t.end()
})
